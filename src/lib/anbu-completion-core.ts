export type CompletionTone = 'safe' | 'watch' | 'danger' | 'neutral' | 'complete'
export type CompletionEventType =
  | 'daily_ok'
  | 'opened'
  | 'assigned'
  | 'called'
  | 'closed'
  | 'note'

export type CompletionCaseStatus = 'open' | 'assigned' | 'closed'

export type CompletionSourceRow = Record<string, unknown>

export type CompletionEvent = {
  id: string
  caseId: string
  eventType: CompletionEventType
  label: string
  reasonType: string
  riskLevel: string
  status: string
  actorName: string
  method: string
  resultType: string
  note: string
  createdAt: string
  payload: Record<string, unknown>
}

export type CompletionCase = {
  caseId: string
  title: string
  reasonType: string
  riskLevel: string
  status: CompletionCaseStatus
  assignedTo: string
  openedAt: string
  closedAt: string
  closeResult: string
  closeNote: string
  timeline: CompletionEvent[]
}

export type CompletionDashboard = {
  status: {
    key: 'normal' | 'watch' | 'needs_check' | 'completed' | 'data_gap'
    label: string
    title: string
    desc: string
    tone: CompletionTone
  }
  todayLine: string
  openCases: CompletionCase[]
  closedCases: CompletionCase[]
  allCases: CompletionCase[]
  dailyOkCount: number
  metrics: {
    totalCases: number
    openCount: number
    closedCount: number
    completionRate: number
    averageCloseMinutes: number | null
  }
  reportText: string
  notice: string
}

export function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parsePayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {}
    } catch {
      return {}
    }
  }

  return {}
}

export function kstNowLabel(date = new Date()) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function kstTodayDate(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function kstDayRange(dateString = kstTodayDate()) {
  const start = new Date(`${dateString}T00:00:00+09:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

export function minutesBetween(startIso: string, endIso: string) {
  const start = Date.parse(startIso)
  const end = Date.parse(endIso)

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null

  return Math.round((end - start) / 60000)
}

function eventTypeFromSignal(signalType: string, payload: Record<string, unknown>): CompletionEventType | null {
  const fromPayload = text(payload.eventType) as CompletionEventType

  if (
    fromPayload === 'daily_ok' ||
    fromPayload === 'opened' ||
    fromPayload === 'assigned' ||
    fromPayload === 'called' ||
    fromPayload === 'closed' ||
    fromPayload === 'note'
  ) {
    return fromPayload
  }

  if (signalType === 'completion_daily_ok') return 'daily_ok'
  if (signalType === 'completion_case_opened') return 'opened'
  if (signalType === 'completion_case_assigned') return 'assigned'
  if (signalType === 'completion_case_called') return 'called'
  if (signalType === 'completion_case_closed') return 'closed'
  if (signalType === 'completion_case_note') return 'note'

  return null
}

export function completionEventFromRow(row: CompletionSourceRow): CompletionEvent | null {
  const signalType = text(row.signal_type)
  const payload = parsePayload(row.payload)
  const source = text(payload.source)

  if (source !== 'anbu_completion' && !signalType.startsWith('completion_')) {
    return null
  }

  const eventType = eventTypeFromSignal(signalType, payload)

  if (!eventType) return null

  const caseId = text(payload.caseId)

  return {
    id: text(row.id) || `${caseId || eventType}-${text(row.created_at) || Date.now()}`,
    caseId,
    eventType,
    label: text(row.signal_label) || text(payload.label) || '안부 확인',
    reasonType: text(payload.reasonType) || 'general',
    riskLevel: text(row.risk_level) || text(payload.riskLevel) || 'low',
    status: text(row.status) || text(payload.status) || 'recorded',
    actorName: text(payload.actorName),
    method: text(payload.method),
    resultType: text(payload.resultType),
    note: text(payload.note),
    createdAt: text(row.created_at) || new Date().toISOString(),
    payload
  }
}

export function buildCompletionCases(events: CompletionEvent[]) {
  const map = new Map<string, CompletionCase>()

  for (const event of events) {
    if (!event.caseId) continue

    const existing = map.get(event.caseId)

    const next: CompletionCase = existing || {
      caseId: event.caseId,
      title: event.label || '안부 확인 필요',
      reasonType: event.reasonType || 'general',
      riskLevel: event.riskLevel || 'medium',
      status: 'open',
      assignedTo: '',
      openedAt: event.createdAt,
      closedAt: '',
      closeResult: '',
      closeNote: '',
      timeline: []
    }

    next.timeline.push(event)

    if (event.eventType === 'opened') {
      next.title = event.label || next.title
      next.reasonType = event.reasonType || next.reasonType
      next.riskLevel = event.riskLevel || next.riskLevel
      next.openedAt = event.createdAt || next.openedAt
    }

    if (event.eventType === 'assigned') {
      next.assignedTo = event.actorName || next.assignedTo || '보호자'
      if (next.status !== 'closed') next.status = 'assigned'
    }

    if (event.eventType === 'called') {
      next.assignedTo = event.actorName || next.assignedTo
    }

    if (event.eventType === 'closed') {
      next.status = 'closed'
      next.closedAt = event.createdAt
      next.closeResult = event.resultType || event.label || '확인 완료'
      next.closeNote = event.note
      next.assignedTo = event.actorName || next.assignedTo
    }

    map.set(event.caseId, next)
  }

  return Array.from(map.values())
    .map((caseItem) => ({
      ...caseItem,
      timeline: caseItem.timeline.sort(
        (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
      )
    }))
    .sort((a, b) => {
      if (a.status !== 'closed' && b.status === 'closed') return -1
      if (a.status === 'closed' && b.status !== 'closed') return 1
      return Date.parse(b.openedAt) - Date.parse(a.openedAt)
    })
}

function buildStatus(openCases: CompletionCase[], closedCases: CompletionCase[], dailyOkCount: number) {
  if (openCases.length > 0) {
    const high = openCases.some((caseItem) => caseItem.riskLevel === 'high')
    const onlyDataGap = openCases.every((caseItem) => caseItem.reasonType === 'data_gap')

    if (onlyDataGap) {
      return {
        key: 'data_gap' as const,
        label: '데이터 부족',
        title: '상태 이상이 아니라 확인 자료가 부족합니다.',
        desc: '반지·앱·응답 데이터가 충분하지 않아 먼저 데이터 상태 확인이 필요합니다.',
        tone: 'neutral' as CompletionTone
      }
    }

    return {
      key: high ? 'needs_check' as const : 'watch' as const,
      label: high ? '확인 필요' : '주의',
      title: high ? '지금 확인이 필요한 안부 신호가 있습니다.' : '오늘 안부 확인이 필요합니다.',
      desc: '알림을 보내고 끝내지 않고, 담당자 지정과 실제 확인 완료까지 기록합니다.',
      tone: high ? 'danger' as CompletionTone : 'watch' as CompletionTone
    }
  }

  if (closedCases.length > 0) {
    return {
      key: 'completed' as const,
      label: '확인 완료',
      title: '확인이 필요한 상황이 처리 완료되었습니다.',
      desc: '누가 언제 어떻게 확인했고 어떤 결과였는지 안부완료 리포트에 남았습니다.',
      tone: 'complete' as CompletionTone
    }
  }

  if (dailyOkCount > 0) {
    return {
      key: 'normal' as const,
      label: '정상',
      title: '오늘 안부는 정상으로 기록되었습니다.',
      desc: '정상 응답은 조용히 저장하고, 보호자에게는 요약 리포트 중심으로 전달합니다.',
      tone: 'safe' as CompletionTone
    }
  }

  return {
    key: 'data_gap' as const,
    label: '확인 대기',
    title: '아직 오늘 안부 확인 자료가 충분하지 않습니다.',
    desc: '응답 없음은 식사·복약 실패로 단정하지 않고, 미확인 상태로만 관리합니다.',
    tone: 'neutral' as CompletionTone
  }
}

function resultLabel(value: string) {
  const map: Record<string, string> = {
    same_as_usual: '평소와 같음',
    meal_confirmed: '식사 확인 완료',
    medication_confirmed: '복약 확인 완료',
    device_issue: '기기·데이터 문제',
    phone_missed: '휴대폰 미확인',
    felt_unwell: '몸 상태 불편',
    contact_failed: '연락 실패',
    emergency_guided: '응급 연락 안내',
    other: '기타'
  }

  return map[value] || value || '확인 완료'
}

function reasonLabel(value: string) {
  const map: Record<string, string> = {
    no_response: '미응답',
    condition: '몸 상태 확인',
    help: '도움 요청',
    meal: '식사 확인',
    medication: '복약 확인',
    data_gap: '데이터 부족',
    manual: '수동 확인',
    general: '일반 안부'
  }

  return map[value] || value || '안부 확인'
}

export function buildCompletionReport(input: {
  familyName: string
  guardianName: string
  dashboard: Omit<CompletionDashboard, 'reportText' | 'notice'>
}) {
  const { familyName, guardianName, dashboard } = input
  const lines: string[] = []

  lines.push('[안부웍스] 안부완료 리포트')
  lines.push('')
  lines.push(`대상자: ${familyName || '부모님'}`)
  lines.push(`보호자: ${guardianName || '보호자'}`)
  lines.push(`생성시각: ${kstNowLabel()}`)
  lines.push('')
  lines.push(`오늘 상태: ${dashboard.status.label}`)
  lines.push(`요약: ${dashboard.todayLine}`)
  lines.push('')

  if (dashboard.allCases.length === 0) {
    lines.push('확인 사건')
    lines.push('- 오늘 생성된 확인필요 사건이 없습니다.')
  } else {
    lines.push('확인 사건')

    for (const caseItem of dashboard.allCases.slice(0, 8)) {
      lines.push(`- ${caseItem.title}`)
      lines.push(`  상태: ${caseItem.status === 'closed' ? '확인 완료' : caseItem.status === 'assigned' ? '담당자 지정' : '확인 필요'}`)
      lines.push(`  사유: ${reasonLabel(caseItem.reasonType)}`)
      lines.push(`  발생: ${kstNowLabel(new Date(caseItem.openedAt))}`)

      if (caseItem.assignedTo) {
        lines.push(`  담당: ${caseItem.assignedTo}`)
      }

      if (caseItem.closedAt) {
        lines.push(`  완료: ${kstNowLabel(new Date(caseItem.closedAt))}`)
        lines.push(`  결과: ${resultLabel(caseItem.closeResult)}`)
      }

      if (caseItem.closeNote) {
        lines.push(`  메모: ${caseItem.closeNote}`)
      }
    }
  }

  lines.push('')
  lines.push('운영 지표')
  lines.push(`- 전체 확인 사건: ${dashboard.metrics.totalCases}건`)
  lines.push(`- 미완료 사건: ${dashboard.metrics.openCount}건`)
  lines.push(`- 완료 사건: ${dashboard.metrics.closedCount}건`)
  lines.push(`- 확인완료율: ${dashboard.metrics.completionRate}%`)

  if (dashboard.metrics.averageCloseMinutes !== null) {
    lines.push(`- 평균 확인 소요시간: ${dashboard.metrics.averageCloseMinutes}분`)
  }

  lines.push('')
  lines.push('비의료 고지')
  lines.push('본 리포트는 의료 진단·치료·응급구조 판단 자료가 아니라, 일상 안부 확인과 후속조치 기록을 돕는 참고 정보입니다.')

  return lines.join('\n')
}

export function buildCompletionDashboard(input: {
  familyName: string
  guardianName: string
  events: CompletionEvent[]
}): CompletionDashboard {
  const dailyOkCount = input.events.filter((event) => event.eventType === 'daily_ok').length
  const cases = buildCompletionCases(input.events)
  const openCases = cases.filter((caseItem) => caseItem.status !== 'closed')
  const closedCases = cases.filter((caseItem) => caseItem.status === 'closed')
  const status = buildStatus(openCases, closedCases, dailyOkCount)

  const closeMinutes = closedCases
    .map((caseItem) => minutesBetween(caseItem.openedAt, caseItem.closedAt))
    .filter((value): value is number => value !== null)

  const averageCloseMinutes = closeMinutes.length
    ? Math.round(closeMinutes.reduce((sum, value) => sum + value, 0) / closeMinutes.length)
    : null

  const completionRate = cases.length
    ? Math.round((closedCases.length / cases.length) * 100)
    : dailyOkCount > 0 ? 100 : 0

  const todayLine =
    openCases.length > 0
      ? `${openCases.length}건의 확인필요 상황이 남아 있습니다. 담당자 지정과 실제 확인 결과 입력이 필요합니다.`
      : closedCases.length > 0
        ? `${closedCases.length}건의 확인필요 상황이 확인 완료되었습니다.`
        : dailyOkCount > 0
          ? '오늘은 정상 안부가 확인되었습니다.'
          : '아직 오늘 안부 확인 자료가 충분하지 않습니다.'

  const partial = {
    status,
    todayLine,
    openCases,
    closedCases,
    allCases: cases,
    dailyOkCount,
    metrics: {
      totalCases: cases.length,
      openCount: openCases.length,
      closedCount: closedCases.length,
      completionRate,
      averageCloseMinutes
    }
  }

  const reportText = buildCompletionReport({
    familyName: input.familyName,
    guardianName: input.guardianName,
    dashboard: partial
  })

  return {
    ...partial,
    reportText,
    notice: '안부웍스는 의료 진단이 아니라 비의료 안부확인과 후속조치 기록을 지원합니다.'
  }
}
