export type OutcomeSourceType =
  | 'risk_action'
  | 'escalation'
  | 'safety_loop'
  | 'care_request'
  | 'care_report'
  | 'pilot_event'

export type OutcomeStatus = 'pending' | 'labeled' | 'closed'
export type OutcomeRisk = 'normal' | 'watch' | 'risk' | 'urgent'

export type OutcomeCandidate = {
  key: string
  sourceType: OutcomeSourceType
  sourceId: string
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  title: string
  description: string
  actionType: string
  actionLabel: string
  sourceStatus: string
  riskLevel: OutcomeRisk
  createdAt: string
  ageHours: number | null
  outcomeStatus: OutcomeStatus
  outcome?: {
    id: string
    outcomeCategory: string
    outcomeLabel: string
    outcomeStatus: string
    confidenceScore: number | null
    impactScore: number | null
    followUpRequired: boolean
    followUpNote: string
    memo: string
    actorName: string
    createdAt: string
    updatedAt: string
  } | null
  learningNotes: string[]
  recommendedNextLabels: string[]
  sourcePayload: Record<string, unknown>
}

export type OutcomeDashboard = {
  generatedAt: string
  cards: Array<{
    key: string
    label: string
    value: string | number
    help: string
  }>
  candidates: OutcomeCandidate[]
  systemInsights: string[]
  learningReport: string
  rawCounts: Record<string, number>
}

export const outcomeCategories = [
  {
    value: 'resolved_ok',
    label: '문제 없음 확인',
    desc: '보호자가 확인했고 특별한 문제 없이 종료되었습니다.'
  },
  {
    value: 'contact_success',
    label: '통화 성공',
    desc: '부모님 또는 보호자와 통화 연결이 되었습니다.'
  },
  {
    value: 'contact_failed',
    label: '통화 실패',
    desc: '통화를 시도했지만 연결되지 않았습니다.'
  },
  {
    value: 'needs_followup',
    label: '추가 확인 필요',
    desc: '당장 종료하기 어렵고 추가 확인이 필요합니다.'
  },
  {
    value: 'care_partner_needed',
    label: '케어파트너 필요',
    desc: '현장확인 또는 방문확인이 필요합니다.'
  },
  {
    value: 'care_partner_completed',
    label: '케어파트너 확인 완료',
    desc: '케어파트너가 현장확인 또는 리포트를 완료했습니다.'
  },
  {
    value: 'hospital_needed',
    label: '병원 확인 필요',
    desc: '진단이 아니라 병원 일정 또는 진료 확인이 필요하다고 판단했습니다.'
  },
  {
    value: 'emergency_action',
    label: '응급 대응 필요',
    desc: '응급 가능성이 있어 보호자 직접 확인 또는 119 등 즉시 대응이 필요합니다.'
  },
  {
    value: 'false_alarm',
    label: '오탐/불필요 알림',
    desc: '실제 문제는 없었고 알림 조건 조정이 필요합니다.'
  },
  {
    value: 'burden_issue',
    label: '부모님 부담 이슈',
    desc: '부모님이 알림이나 확인 요청을 부담스러워했습니다.'
  }
] as const

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown, fallback = 0) {
  const valueNumber = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(valueNumber) ? valueNumber : fallback
}

function boolValue(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true'
  return Boolean(value)
}

function dateMs(value: unknown) {
  const raw = text(value)
  if (!raw) return 0

  const ms = new Date(raw).getTime()

  return Number.isFinite(ms) ? ms : 0
}

function iso(value: unknown) {
  const ms = dateMs(value)

  if (!ms) return new Date().toISOString()

  return new Date(ms).toISOString()
}

function hoursSince(value: unknown) {
  const ms = dateMs(value)
  if (!ms) return null

  const hours = (Date.now() - ms) / (1000 * 60 * 60)

  return Math.max(0, Math.round(hours * 10) / 10)
}

function groupByFamily(rows: Array<Record<string, unknown>>) {
  const map = new Map<string, Array<Record<string, unknown>>>()

  for (const row of rows) {
    const code = text(row.family_code)
    if (!code) continue

    const list = map.get(code) || []
    list.push(row)
    map.set(code, list)
  }

  return map
}

function familyMap(rows: Array<Record<string, unknown>>) {
  const map = new Map<string, Record<string, unknown>>()

  for (const row of rows) {
    const code = text(row.family_code)
    if (!code) continue
    if (!map.has(code)) map.set(code, row)
  }

  return map
}

function outcomeKey(sourceType: string, sourceId: string) {
  return `${sourceType}:${sourceId}`
}

function outcomeMap(rows: Array<Record<string, unknown>>) {
  const map = new Map<string, Record<string, unknown>>()

  for (const row of rows) {
    const sourceType = text(row.source_type)
    const sourceId = text(row.source_id)

    if (!sourceType || !sourceId) continue

    map.set(outcomeKey(sourceType, sourceId), row)
  }

  return map
}

function sourceId(row: Record<string, unknown>, fallbackPrefix: string) {
  return (
    text(row.id) ||
    `${fallbackPrefix}:${text(row.family_code)}:${dateMs(row.created_at) || dateMs(row.updated_at) || 0}:${text(row.action_type) || text(row.status)}`
  )
}

function riskFromText(input: {
  sourceType: OutcomeSourceType
  actionType: string
  status: string
  riskLevel: string
  reportStatus: string
}) {
  if (input.riskLevel === 'urgent') return 'urgent' as const
  if (input.riskLevel === 'risk') return 'risk' as const

  if (input.actionType.includes('emergency')) return 'urgent'
  if (input.actionType.includes('partner')) return 'risk'
  if (input.actionType.includes('family')) return 'risk'
  if (input.actionType.includes('guardian')) return 'watch'
  if (input.actionType.includes('call')) return 'watch'
  if (input.status === 'requested' || input.status === 'matching' || input.status === 'assigned') return 'watch'
  if (input.reportStatus === 'needs_revision') return 'watch'

  if (input.sourceType === 'care_report' && input.reportStatus === 'submitted') return 'watch'
  if (input.sourceType === 'care_request') return 'watch'

  return 'normal'
}

function outcomeLabel(row: Record<string, unknown> | undefined) {
  if (!row) return null

  return {
    id: text(row.id),
    outcomeCategory: text(row.outcome_category),
    outcomeLabel: text(row.outcome_label),
    outcomeStatus: text(row.outcome_status),
    confidenceScore: row.confidence_score === null || row.confidence_score === undefined ? null : numberValue(row.confidence_score),
    impactScore: row.impact_score === null || row.impact_score === undefined ? null : numberValue(row.impact_score),
    followUpRequired: boolValue(row.follow_up_required),
    followUpNote: text(row.follow_up_note),
    memo: text(row.memo),
    actorName: text(row.actor_name),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  }
}

function outcomeStatus(row: Record<string, unknown> | undefined) {
  if (!row) return 'pending' as const
  if (text(row.outcome_status) === 'closed') return 'closed' as const
  return 'labeled' as const
}

function familyInfo(code: string, families: Map<string, Record<string, unknown>>) {
  const family = families.get(code) || {}

  return {
    parentName: text(family.parent_name) || '부모님',
    guardianName: text(family.guardian_name) || '보호자',
    guardianPhone: text(family.guardian_phone)
  }
}

function learningNotes(input: {
  actionType: string
  sourceType: OutcomeSourceType
  riskLevel: OutcomeRisk
  hasOutcome: boolean
  outcomeCategory?: string
  followUpRequired?: boolean
}) {
  const notes: string[] = []

  if (!input.hasOutcome) {
    notes.push('이 조치의 실제 결과가 아직 기록되지 않았습니다.')
  }

  if (input.riskLevel === 'urgent' || input.riskLevel === 'risk') {
    notes.push('위험도가 높은 조치이므로 결과 라벨링이 우선 필요합니다.')
  }

  if (input.actionType.includes('partner')) {
    notes.push('케어파트너 요청 결과는 방문 완료/부재/취소/추가 확인 필요로 구분해 기록하세요.')
  }

  if (input.actionType.includes('call')) {
    notes.push('전화 확인 결과는 통화 성공/실패/문제 없음/추가 확인 필요로 기록하세요.')
  }

  if (input.outcomeCategory === 'false_alarm') {
    notes.push('오탐으로 확인된 경우 향후 알림 조건 조정에 활용됩니다.')
  }

  if (input.outcomeCategory === 'burden_issue') {
    notes.push('부모님 부담 이슈는 알림 시간·빈도 조정 데이터로 활용됩니다.')
  }

  if (input.followUpRequired) {
    notes.push('후속 조치 필요 라벨이 있어 다음 운영 확인이 필요합니다.')
  }

  return Array.from(new Set(notes))
}

function recommendedLabels(input: {
  actionType: string
  sourceType: OutcomeSourceType
  riskLevel: OutcomeRisk
}) {
  const labels: string[] = []

  if (input.actionType.includes('call') || input.actionType.includes('guardian')) {
    labels.push('통화 성공')
    labels.push('통화 실패')
    labels.push('문제 없음 확인')
    labels.push('추가 확인 필요')
  }

  if (input.actionType.includes('partner') || input.sourceType === 'care_request') {
    labels.push('케어파트너 필요')
    labels.push('케어파트너 확인 완료')
    labels.push('추가 확인 필요')
  }

  if (input.sourceType === 'care_report') {
    labels.push('케어파트너 확인 완료')
    labels.push('추가 확인 필요')
  }

  if (input.riskLevel === 'urgent') {
    labels.push('응급 대응 필요')
    labels.push('병원 확인 필요')
  }

  labels.push('오탐/불필요 알림')
  labels.push('부모님 부담 이슈')

  return Array.from(new Set(labels))
}

function makeCandidate(input: {
  sourceType: OutcomeSourceType
  row: Record<string, unknown>
  families: Map<string, Record<string, unknown>>
  outcomes: Map<string, Record<string, unknown>>
  title: string
  description: string
  actionType: string
  actionLabel: string
  status: string
  riskLevel?: string
  reportStatus?: string
  createdAt?: string
}) {
  const familyCode = text(input.row.family_code)
  const id = sourceId(input.row, input.sourceType)
  const key = outcomeKey(input.sourceType, id)
  const outcomeRow = input.outcomes.get(key)
  const info = familyInfo(familyCode, input.families)

  const risk = riskFromText({
    sourceType: input.sourceType,
    actionType: input.actionType,
    status: input.status,
    riskLevel: input.riskLevel || '',
    reportStatus: input.reportStatus || ''
  })

  const normalizedOutcome = outcomeLabel(outcomeRow)

  return {
    key,
    sourceType: input.sourceType,
    sourceId: id,
    familyCode,
    parentName: info.parentName,
    guardianName: info.guardianName,
    guardianPhone: info.guardianPhone,
    title: input.title,
    description: input.description,
    actionType: input.actionType,
    actionLabel: input.actionLabel,
    sourceStatus: input.status,
    riskLevel: risk,
    createdAt: iso(input.createdAt || input.row.created_at || input.row.updated_at),
    ageHours: hoursSince(input.createdAt || input.row.created_at || input.row.updated_at),
    outcomeStatus: outcomeStatus(outcomeRow),
    outcome: normalizedOutcome,
    learningNotes: learningNotes({
      actionType: input.actionType,
      sourceType: input.sourceType,
      riskLevel: risk,
      hasOutcome: Boolean(normalizedOutcome),
      outcomeCategory: normalizedOutcome?.outcomeCategory,
      followUpRequired: normalizedOutcome?.followUpRequired
    }),
    recommendedNextLabels: recommendedLabels({
      actionType: input.actionType,
      sourceType: input.sourceType,
      riskLevel: risk
    }),
    sourcePayload: input.row
  } satisfies OutcomeCandidate
}

export function buildOutcomeDashboard(input: {
  families: Array<Record<string, unknown>>
  riskActionEvents: Array<Record<string, unknown>>
  escalationEvents: Array<Record<string, unknown>>
  safetyActions: Array<Record<string, unknown>>
  careRequests: Array<Record<string, unknown>>
  reports: Array<Record<string, unknown>>
  pilotEvents: Array<Record<string, unknown>>
  outcomeLabels: Array<Record<string, unknown>>
}): OutcomeDashboard {
  const families = familyMap(input.families)
  const outcomes = outcomeMap(input.outcomeLabels)

  const candidates: OutcomeCandidate[] = []

  for (const row of input.riskActionEvents) {
    candidates.push(makeCandidate({
      sourceType: 'risk_action',
      row,
      families,
      outcomes,
      title: 'Risk-to-Action 조치',
      description: text(row.memo) || '위험 신호를 행동 가이드로 전환한 기록입니다.',
      actionType: text(row.action_type),
      actionLabel: text(row.action_label) || text(row.action_type),
      status: text(row.status),
      riskLevel: text(row.risk_level),
      createdAt: text(row.created_at)
    }))
  }

  for (const row of input.escalationEvents) {
    candidates.push(makeCandidate({
      sourceType: 'escalation',
      row,
      families,
      outcomes,
      title: '무응답 에스컬레이션',
      description: text(row.memo) || '무응답 단계별 운영 조치 기록입니다.',
      actionType: text(row.action_type),
      actionLabel: text(row.action_label) || text(row.action_type),
      status: text(row.status),
      riskLevel: text(row.stage),
      createdAt: text(row.created_at)
    }))
  }

  for (const row of input.safetyActions) {
    candidates.push(makeCandidate({
      sourceType: 'safety_loop',
      row,
      families,
      outcomes,
      title: '안심루프 조치',
      description: text(row.memo) || '안심루프에서 보호자 또는 운영실이 수행한 조치입니다.',
      actionType: text(row.action_type),
      actionLabel: text(row.action_label) || text(row.action_type),
      status: text(row.status),
      createdAt: text(row.created_at)
    }))
  }

  for (const row of input.careRequests) {
    candidates.push(makeCandidate({
      sourceType: 'care_request',
      row,
      families,
      outcomes,
      title: '케어파트너 요청',
      description: text(row.details) || '케어파트너 현장확인 또는 방문 요청입니다.',
      actionType: text(row.request_type) || 'care_request',
      actionLabel: '케어파트너 요청',
      status: text(row.status) || 'requested',
      createdAt: text(row.created_at)
    }))
  }

  for (const row of input.reports) {
    candidates.push(makeCandidate({
      sourceType: 'care_report',
      row,
      families,
      outcomes,
      title: '케어 리포트',
      description: text(row.summary) || text(row.notes) || '케어파트너 현장확인 리포트입니다.',
      actionType: 'care_report',
      actionLabel: text(row.report_status) || '리포트',
      status: text(row.report_status) || 'submitted',
      reportStatus: text(row.report_status),
      createdAt: text(row.created_at)
    }))
  }

  for (const row of input.pilotEvents) {
    const eventType = text(row.event_type)

    if (!['resolved', 'issue_reported', 'completed'].includes(eventType)) continue

    candidates.push(makeCandidate({
      sourceType: 'pilot_event',
      row,
      families,
      outcomes,
      title: '실증 운영 이벤트',
      description: text(row.memo) || '실증 운영실에서 남긴 결과성 이벤트입니다.',
      actionType: eventType,
      actionLabel: text(row.event_label) || eventType,
      status: text(row.status),
      createdAt: text(row.created_at)
    }))
  }

  candidates.sort((a, b) => {
    const riskWeight = { urgent: 4, risk: 3, watch: 2, normal: 1 }
    const statusWeight = { pending: 3, labeled: 2, closed: 1 }

    const riskDiff = (riskWeight[b.riskLevel] || 0) - (riskWeight[a.riskLevel] || 0)
    if (riskDiff !== 0) return riskDiff

    const statusDiff = (statusWeight[b.outcomeStatus] || 0) - (statusWeight[a.outcomeStatus] || 0)
    if (statusDiff !== 0) return statusDiff

    return dateMs(b.createdAt) - dateMs(a.createdAt)
  })

  const pending = candidates.filter((item) => item.outcomeStatus === 'pending').length
  const labeled = candidates.filter((item) => item.outcomeStatus !== 'pending').length
  const closed = candidates.filter((item) => item.outcomeStatus === 'closed').length
  const followUp = candidates.filter((item) => item.outcome?.followUpRequired).length
  const urgentPending = candidates.filter((item) => item.outcomeStatus === 'pending' && ['urgent', 'risk'].includes(item.riskLevel)).length
  const falseAlarms = candidates.filter((item) => item.outcome?.outcomeCategory === 'false_alarm').length
  const burdenIssues = candidates.filter((item) => item.outcome?.outcomeCategory === 'burden_issue').length

  const labelingRate = candidates.length === 0 ? 0 : Math.round((labeled / candidates.length) * 100)
  const closeRate = candidates.length === 0 ? 0 : Math.round((closed / candidates.length) * 100)

  const systemInsights: string[] = []

  systemInsights.push(`전체 조치 후보 ${candidates.length}건 중 ${labeled}건이 결과 라벨링되었습니다.`)
  systemInsights.push(`결과 라벨링률은 ${labelingRate}%입니다.`)

  if (urgentPending > 0) {
    systemInsights.push(`위험도가 높은 미라벨링 조치가 ${urgentPending}건 있습니다. 우선 확인이 필요합니다.`)
  }

  if (followUp > 0) {
    systemInsights.push(`후속 조치가 필요한 결과가 ${followUp}건 있습니다.`)
  }

  if (falseAlarms > 0) {
    systemInsights.push(`오탐 또는 불필요 알림으로 분류된 결과가 ${falseAlarms}건 있습니다. 알림 조건 고도화에 활용하세요.`)
  }

  if (burdenIssues > 0) {
    systemInsights.push(`부모님 부담 이슈가 ${burdenIssues}건 확인되었습니다. 부담도 기반 알림 조정에 활용하세요.`)
  }

  if (candidates.length === 0) {
    systemInsights.push('아직 라벨링할 조치 후보가 없습니다. Risk-to-Action, 안심루프, 무응답 관리 데이터를 먼저 생성하세요.')
  }

  const learningReport = [
    '# Outcome Labeling Engine™ 학습 요약',
    '',
    `- 생성일: ${new Date().toLocaleString('ko-KR')}`,
    `- 전체 조치 후보: ${candidates.length}건`,
    `- 결과 라벨링 완료: ${labeled}건`,
    `- 라벨링률: ${labelingRate}%`,
    `- 확인 종료율: ${closeRate}%`,
    `- 후속 조치 필요: ${followUp}건`,
    `- 오탐/불필요 알림: ${falseAlarms}건`,
    `- 부모님 부담 이슈: ${burdenIssues}건`,
    '',
    '## 운영 인사이트',
    ...systemInsights.map((item) => `- ${item}`),
    '',
    '## 고도화 방향',
    '- 어떤 위험 신호가 실제 문제로 이어졌는지 결과 라벨을 축적합니다.',
    '- 보호자 행동 추천의 성공/실패 결과를 기반으로 Risk-to-Action 규칙을 고도화합니다.',
    '- 오탐과 부모님 부담 이슈를 분리해 알림 빈도와 확인 시간대를 조정합니다.'
  ].join('\n')

  return {
    generatedAt: new Date().toISOString(),
    cards: [
      {
        key: 'candidates',
        label: '조치 후보',
        value: candidates.length,
        help: '라벨링 가능한 운영 조치'
      },
      {
        key: 'pending',
        label: '미라벨링',
        value: pending,
        help: '실제 결과 미기록'
      },
      {
        key: 'labeling',
        label: '라벨링률',
        value: `${labelingRate}%`,
        help: '결과 기록 완료 비율'
      },
      {
        key: 'followup',
        label: '후속 필요',
        value: followUp,
        help: '다음 운영 확인 필요'
      }
    ],
    candidates,
    systemInsights,
    learningReport,
    rawCounts: {
      families: input.families.length,
      riskActionEvents: input.riskActionEvents.length,
      escalationEvents: input.escalationEvents.length,
      safetyActions: input.safetyActions.length,
      careRequests: input.careRequests.length,
      reports: input.reports.length,
      pilotEvents: input.pilotEvents.length,
      outcomeLabels: input.outcomeLabels.length
    }
  }
}
