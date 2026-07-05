export type AutoMode = 'simple' | 'standard' | 'intensive'
export type AutoStatus = 'normal' | 'data_insufficient' | 'needs_check'
export type ParentExperienceMode = 'passive' | 'quick_check' | 'routine'
export type Row = Record<string, unknown>

export type AutoProfile = {
  mode: AutoMode
  label: string
  description: string
}

export type AutoAssessment = {
  key: AutoStatus
  tone: 'safe' | 'watch' | 'danger'
  label: string
  title: string
  reason: string
  nextAction: string
  confidence: number
  dataQuality: number
  battery: number | null
  lastSyncAt: string | null
  hoursSinceSync: number | null
  wearing: 'wearing' | 'not_wearing' | 'unknown'
  parentExperience: {
    mode: ParentExperienceMode
    title: string
    description: string
  }
  learningHint: string
}

export const AUTO_PROFILES: Record<AutoMode, AutoProfile> = {
  simple: {
    mode: 'simple',
    label: '간편 모드',
    description: '평소와 다르거나 데이터가 부족할 때만 부모님께 확인합니다.'
  },
  standard: {
    mode: 'standard',
    label: '표준 모드',
    description: '평소에는 자동 확인하고, 저녁 1회 또는 변화가 있을 때만 확인합니다.'
  },
  intensive: {
    mode: 'intensive',
    label: '집중 모드',
    description: '퇴원 직후처럼 집중 확인이 필요한 기간에 아침·점심·저녁을 확인합니다.'
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function objectValue(value: unknown): Row {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Row
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Row
        : {}
    } catch {
      return {}
    }
  }

  return {}
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function parseDate(value: unknown): Date | null {
  const raw = text(value)
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function metricValue(metrics: Row, keys: string[]): unknown {
  for (const key of keys) {
    if (key in metrics && metrics[key] !== null && metrics[key] !== undefined) {
      return metrics[key]
    }
  }

  for (const value of Object.values(metrics)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const nested = metricValue(value as Row, keys)
    if (nested !== undefined && nested !== null && nested !== '') return nested
  }

  return undefined
}

function normalizeWearing(value: unknown): AutoAssessment['wearing'] {
  if (value === true) return 'wearing'
  if (value === false) return 'not_wearing'

  const raw = text(value).toLowerCase()
  if (['wearing', 'worn', 'on', '착용', '착용중', 'true', '1'].includes(raw)) {
    return 'wearing'
  }
  if (['not_wearing', 'not-wearing', 'off', '미착용', 'false', '0'].includes(raw)) {
    return 'not_wearing'
  }
  return 'unknown'
}

function kstHour(now: Date) {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    hourCycle: 'h23'
  }).format(now)
  return Number(hour)
}

function recentRiskRequest(rows: Row[], now: Date) {
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000

  return rows.find((row) => {
    const created = parseDate(row.created_at)
    if (created && created.getTime() < cutoff) return false

    const status = text(row.status).toLowerCase()
    if (['resolved', 'completed', 'closed', 'cancelled'].includes(status)) return false

    const risk = text(row.risk_level).toLowerCase()
    const signal = text(row.signal_type).toLowerCase()

    return (
      risk === 'high' ||
      risk === 'danger' ||
      risk === 'medium' ||
      signal.includes('need_help') ||
      signal.includes('feeling_sick') ||
      signal.includes('meal_not_done') ||
      signal.includes('medication_not_done') ||
      signal.includes('no_response')
    )
  })
}

function learningSummary(feedbackRows: Row[]) {
  const labels: Record<string, string> = {
    normal: '실제 확인 결과 평소와 같았던 경우가 많았습니다.',
    ring_off: '최근에는 반지를 빼놓은 경우가 자주 확인됐습니다.',
    charging: '최근에는 충전 중이라 데이터가 끊긴 경우가 자주 확인됐습니다.',
    late_sleep: '최근에는 늦잠이나 수면 시간 변화로 확인된 경우가 많았습니다.',
    outside: '최근에는 외출 중이라 동기화가 늦어진 경우가 많았습니다.',
    meal_missed: '최근에는 실제 식사 확인이 필요했던 경우가 있었습니다.',
    unwell: '최근에는 실제 몸 상태 확인이 필요했던 경우가 있었습니다.',
    unreachable: '최근에는 연락이 닿지 않아 추가 확인이 필요했던 경우가 있었습니다.'
  }

  const counts = new Map<string, number>()

  for (const row of feedbackRows) {
    const payload = objectValue(row.payload)
    const outcome = text(payload.outcome || row.outcome)
    if (!outcome) continue
    counts.set(outcome, (counts.get(outcome) || 0) + 1)
  }

  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  if (!best || best[1] < 2) {
    return '확인 결과가 쌓이면 기기 문제와 실제 안부 변화를 더 정확히 구분합니다.'
  }

  return labels[best[0]] || '확인 결과가 다음 안부 판단에 반영되고 있습니다.'
}

export function normalizeAutoMode(value: unknown): AutoMode {
  return value === 'simple' || value === 'intensive' ? value : 'standard'
}

export function assessAnbuAuto(input: {
  report: Row | null
  recentRequests: Row[]
  openIncident: Row | null
  feedbackRows: Row[]
  mode: AutoMode
  now?: Date
}): AutoAssessment {
  const now = input.now || new Date()
  const report = input.report
  const metrics = objectValue(report?.metrics)

  const reportDate =
    parseDate(report?.updated_at) ||
    parseDate(report?.created_at) ||
    parseDate(report?.report_date)

  const hoursSinceSync = reportDate
    ? Math.max(0, (now.getTime() - reportDate.getTime()) / (60 * 60 * 1000))
    : null

  const qualityRaw =
    numberValue(report?.data_quality_score) ??
    numberValue(metricValue(metrics, ['dataQuality', 'data_quality', 'qualityScore'])) ??
    0

  const dataQuality = Math.max(0, Math.min(100, Math.round(qualityRaw)))

  const batteryRaw = numberValue(
    metricValue(metrics, [
      'battery',
      'batteryLevel',
      'battery_level',
      'batteryPercent',
      'battery_percent'
    ])
  )

  const battery = batteryRaw === null
    ? null
    : Math.max(0, Math.min(100, Math.round(batteryRaw)))

  const wearing = normalizeWearing(
    metricValue(metrics, ['wearing', 'wearingStatus', 'wearing_status', 'isWearing'])
  )

  const overall = text(report?.overall_status).toLowerCase().replace(/[\s-]+/g, '_')
  const score = numberValue(report?.anbu_score)
  const riskyStatus = [
    'danger',
    'critical',
    'warning',
    'watch',
    'attention',
    'check_needed',
    'needs_check',
    'abnormal',
    '확인필요',
    '주의'
  ].some((value) => overall.includes(value))

  const riskyRequest = recentRiskRequest(input.recentRequests, now)
  const hasOpenIncident = Boolean(input.openIncident)
  const noReport = !report
  const stale = hoursSinceSync === null || hoursSinceSync >= 24
  const weakQuality = dataQuality < 45
  const lowBattery = battery !== null && battery <= 15
  const notWearing = wearing === 'not_wearing'

  let key: AutoStatus = 'normal'
  let tone: AutoAssessment['tone'] = 'safe'
  let label = '평소와 비슷해요'
  let title = '지금은 별도 확인이 필요하지 않습니다.'
  let reason = '스마트링 데이터와 오늘 안부 기록이 평소 범위에 있습니다.'
  let nextAction = '저녁 요약만 확인하면 됩니다.'

  if (hasOpenIncident || riskyRequest || riskyStatus || (score !== null && score < 60)) {
    key = 'needs_check'
    tone = 'danger'
    label = '확인이 필요해요'
    title = '부모님께 한 번 연락해 주세요.'
    reason = hasOpenIncident
      ? '아직 완료되지 않은 안부 확인 사건이 있습니다.'
      : riskyRequest
        ? text(riskyRequest.signal_label) || '최근 확인이 필요한 안부 응답이 있었습니다.'
        : text(report?.summary_text) || '평소와 다른 안부 신호가 확인됐습니다.'
    nextAction = '가족 중 한 명이 확인을 맡고 결과를 남겨주세요.'
  } else if (noReport || stale || weakQuality || lowBattery || notWearing) {
    key = 'data_insufficient'
    tone = 'watch'
    label = '데이터가 부족해요'
    title = '건강 이상이 아니라 반지 상태를 먼저 확인해 주세요.'

    if (noReport) {
      reason = '아직 안부완료 리포트가 들어오지 않았습니다.'
    } else if (stale) {
      reason = `스마트링 데이터가 ${Math.round(hoursSinceSync || 0)}시간째 갱신되지 않았습니다.`
    } else if (lowBattery) {
      reason = `반지 배터리가 ${battery}%로 낮습니다.`
    } else if (notWearing) {
      reason = '반지를 착용하지 않은 것으로 추정됩니다.'
    } else {
      reason = `오늘 데이터 신뢰도가 ${dataQuality}%로 충분하지 않습니다.`
    }

    nextAction = '반지 착용·충전·동기화 상태를 먼저 확인하세요.'
  }

  const hour = kstHour(now)
  let parentMode: ParentExperienceMode = 'passive'
  let parentTitle = '추가 입력 없이 자동으로 확인 중이에요.'
  let parentDescription = '평소와 다른 신호가 있을 때만 다시 여쭤볼게요.'

  if (input.mode === 'intensive') {
    parentMode = 'routine'
    parentTitle = '집중 확인 기간이에요.'
    parentDescription = '현재 시간대의 식사와 약을 한 번만 확인해 주세요.'
  } else if (key !== 'normal') {
    parentMode = 'quick_check'
    parentTitle = key === 'data_insufficient'
      ? '반지 데이터가 부족해요. 지금 괜찮으신가요?'
      : '평소와 다른 신호가 있어요. 지금 괜찮으신가요?'
    parentDescription = '글을 쓰지 않고 버튼 하나만 누르면 됩니다.'
  } else if (input.mode === 'standard' && hour >= 18) {
    parentMode = 'routine'
    parentTitle = '오늘 저녁 한 번만 확인해 주세요.'
    parentDescription = '정상적인 날에는 “모두 했어요” 한 번이면 끝납니다.'
  }

  const confidence = key === 'normal'
    ? Math.max(55, dataQuality)
    : key === 'data_insufficient'
      ? Math.min(54, dataQuality)
      : Math.max(60, dataQuality)

  return {
    key,
    tone,
    label,
    title,
    reason,
    nextAction,
    confidence,
    dataQuality,
    battery,
    lastSyncAt: reportDate ? reportDate.toISOString() : null,
    hoursSinceSync,
    wearing,
    parentExperience: {
      mode: parentMode,
      title: parentTitle,
      description: parentDescription
    },
    learningHint: learningSummary(input.feedbackRows)
  }
}

export function outcomeLabel(value: string) {
  const map: Record<string, string> = {
    normal: '평소와 같았어요',
    ring_off: '반지를 빼놓았어요',
    charging: '충전 중이었어요',
    late_sleep: '늦잠을 잤어요',
    outside: '외출 중이었어요',
    meal_missed: '식사를 못 했어요',
    unwell: '몸이 불편했어요',
    unreachable: '연락이 안 됐어요'
  }
  return map[value] || value
}
