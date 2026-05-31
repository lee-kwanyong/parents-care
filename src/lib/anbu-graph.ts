export type GraphNodeKind =
  | 'parent'
  | 'guardian'
  | 'consent'
  | 'risk'
  | 'safety_loop'
  | 'escalation'
  | 'care_request'
  | 'partner'
  | 'report'
  | 'burden'

export type GraphNode = {
  id: string
  kind: GraphNodeKind
  label: string
  status: 'normal' | 'watch' | 'risk' | 'done' | 'unknown'
  score?: number
  subtitle: string
  metrics: Array<{
    label: string
    value: string
  }>
}

export type GraphEdge = {
  id: string
  from: string
  to: string
  label: string
  status: 'normal' | 'watch' | 'risk' | 'done'
}

export type FamilyGraph = {
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  overallState: '정상' | '주의' | '확인 필요'
  riskScore: number
  closureScore: number
  burdenScore: number
  burdenLevel: '낮음' | '보통' | '높음'
  consentScore: number
  noResponseHours: number | null
  lastCheckinAt: string | null
  insights: string[]
  recommendedActions: string[]
  nodes: GraphNode[]
  edges: GraphEdge[]
  raw: {
    family: Record<string, unknown>
    checkins: Array<Record<string, unknown>>
    notifications: Array<Record<string, unknown>>
    consents: Array<Record<string, unknown>>
    safetyActions: Array<Record<string, unknown>>
    escalationEvents: Array<Record<string, unknown>>
    careRequests: Array<Record<string, unknown>>
    matches: Array<Record<string, unknown>>
    reports: Array<Record<string, unknown>>
  }
}

export type AnbuGraphResult = {
  generatedAt: string
  cards: Array<{
    key: string
    label: string
    value: number | string
    help: string
  }>
  families: FamilyGraph[]
  systemInsights: string[]
  rawCounts: Record<string, number>
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function dateMs(value: unknown) {
  const raw = text(value)
  if (!raw) return 0
  const ms = new Date(raw).getTime()
  return Number.isFinite(ms) ? ms : 0
}

function hoursSince(ms: number) {
  if (!ms) return null
  const hours = (Date.now() - ms) / (1000 * 60 * 60)
  return Math.max(0, Math.round(hours * 10) / 10)
}

function latestDate(rows: Array<Record<string, unknown>>, keys: string[]) {
  let latest = 0

  for (const row of rows) {
    for (const key of keys) {
      latest = Math.max(latest, dateMs(row[key]))
    }
  }

  return latest
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

function count<T>(rows: T[], predicate: (row: T) => boolean) {
  return rows.filter(predicate).length
}

function latestRow(rows: Array<Record<string, unknown>>, keys = ['updated_at', 'created_at']) {
  return rows
    .slice()
    .sort((a, b) => latestDate([b], keys) - latestDate([a], keys))[0] || null
}

function consentSettings(consents: Array<Record<string, unknown>>) {
  const row = latestRow(consents)
  const raw = row?.consent_settings

  if (raw && typeof raw === 'object') {
    return raw as Record<string, unknown>
  }

  return {}
}

function trueCount(obj: Record<string, unknown>) {
  return Object.values(obj).filter(Boolean).length
}

function closureRate(actions: Array<Record<string, unknown>>, escalationEvents: Array<Record<string, unknown>>) {
  const riskEvents = escalationEvents.filter((row) =>
    ['stage1', 'stage2', 'stage3', 'help'].includes(text(row.stage)) ||
    ['parent_reprompt', 'guardian_notice', 'family_notice', 'request_partner'].includes(text(row.action_type))
  ).length

  const completed = actions.filter((row) => text(row.action_type) === 'mark_complete').length +
    escalationEvents.filter((row) => text(row.action_type) === 'mark_resolved').length

  if (riskEvents === 0 && completed > 0) return 100
  if (riskEvents === 0) return 80

  return Math.max(0, Math.min(100, Math.round((completed / riskEvents) * 100)))
}

function buildBurdenScore(input: {
  notifications: Array<Record<string, unknown>>
  consents: Array<Record<string, unknown>>
  consentActions: Array<Record<string, unknown>>
  safetyActions: Array<Record<string, unknown>>
  escalationEvents: Array<Record<string, unknown>>
}) {
  const restOrLater = input.consentActions.filter((row) =>
    ['rest_today', 'reply_later'].includes(text(row.action_type))
  ).length

  const helpOrCall = input.consentActions.filter((row) =>
    ['help_needed', 'call_guardian'].includes(text(row.action_type))
  ).length

  const notificationCount = input.notifications.length
  const escalationCount = input.escalationEvents.length
  const safetyActionCount = input.safetyActions.length

  let score = 10
  score += notificationCount * 5
  score += escalationCount * 7
  score += safetyActionCount * 3
  score += restOrLater * 14
  score += helpOrCall * 20

  score = Math.max(0, Math.min(100, score))

  const level: '낮음' | '보통' | '높음' =
    score >= 70
      ? '높음'
      : score >= 35
        ? '보통'
        : '낮음'

  return { score, level }
}

function riskScore(input: {
  checkins: Array<Record<string, unknown>>
  notifications: Array<Record<string, unknown>>
  escalationEvents: Array<Record<string, unknown>>
  careRequests: Array<Record<string, unknown>>
  noResponseHours: number | null
}) {
  let score = 0

  if (input.noResponseHours === null) score += 35
  else if (input.noResponseHours >= 12) score += 35
  else if (input.noResponseHours >= 6) score += 22
  else if (input.noResponseHours >= 3) score += 12

  score += count(input.checkins, (row) =>
    text(row.status) === 'needs_help' ||
    text(row.status) === 'not_done' ||
    text(row.check_type) === 'emergency'
  ) * 16

  score += count(input.notifications, (row) =>
    text(row.reason).includes('no-response') ||
    text(row.title).includes('응답 없음')
  ) * 10

  score += count(input.escalationEvents, (row) =>
    ['stage2', 'stage3', 'help'].includes(text(row.stage))
  ) * 12

  score += count(input.careRequests, (row) =>
    ['requested', 'matching', 'assigned'].includes(text(row.status) || 'requested')
  ) * 8

  return Math.max(0, Math.min(100, score))
}

function stateFromRisk(score: number) {
  if (score >= 60) return '확인 필요' as const
  if (score >= 25) return '주의' as const
  return '정상' as const
}

function statusFromState(state: '정상' | '주의' | '확인 필요') {
  if (state === '확인 필요') return 'risk' as const
  if (state === '주의') return 'watch' as const
  return 'normal' as const
}

function reportStatus(reports: Array<Record<string, unknown>>) {
  const pending = reports.filter((row) =>
    ['submitted', 'needs_revision'].includes(text(row.report_status) || 'submitted')
  ).length

  const approved = reports.filter((row) => text(row.report_status) === 'approved').length

  if (pending > 0) return { status: 'watch' as const, label: `검수 대기 ${pending}건` }
  if (approved > 0) return { status: 'done' as const, label: `승인 리포트 ${approved}건` }
  return { status: 'unknown' as const, label: '리포트 없음' }
}

function insightList(input: {
  noResponseHours: number | null
  risk: number
  burdenScore: number
  consentScore: number
  closureScore: number
  activeCareRequests: number
  pendingReports: number
}) {
  const insights: string[] = []

  if (input.noResponseHours === null) {
    insights.push('최근 안부 응답 기록이 없어 첫 연결 또는 재확인이 필요합니다.')
  } else if (input.noResponseHours >= 12) {
    insights.push(`마지막 안부 후 ${input.noResponseHours}시간이 지나 3단계 확인이 필요합니다.`)
  } else if (input.noResponseHours >= 6) {
    insights.push(`마지막 안부 후 ${input.noResponseHours}시간이 지나 보호자 확인이 권장됩니다.`)
  }

  if (input.risk >= 60) {
    insights.push('위험 점수가 높아 보호자 확인 또는 케어파트너 확인이 필요합니다.')
  }

  if (input.burdenScore >= 70) {
    insights.push('부모님 부담도가 높습니다. 알림 빈도와 확인 시간을 조정해야 합니다.')
  }

  if (input.consentScore < 50) {
    insights.push('공유 동의 항목이 적습니다. 부모님이 불편하지 않도록 동의 기반으로 안내하세요.')
  }

  if (input.closureScore < 50) {
    insights.push('확인 완료율이 낮습니다. 알림 이후 실제 조치 기록을 남겨야 합니다.')
  }

  if (input.activeCareRequests > 0) {
    insights.push(`진행 중인 케어 요청이 ${input.activeCareRequests}건 있습니다.`)
  }

  if (input.pendingReports > 0) {
    insights.push(`운영실 검수 대기 리포트가 ${input.pendingReports}건 있습니다.`)
  }

  if (insights.length === 0) {
    insights.push('현재 가족 돌봄 그래프는 안정적인 흐름을 보입니다.')
  }

  return insights
}

function recommendedActions(input: {
  overallState: '정상' | '주의' | '확인 필요'
  burdenScore: number
  closureScore: number
  activeCareRequests: number
  pendingReports: number
}) {
  const actions: string[] = []

  if (input.overallState === '확인 필요') {
    actions.push('보호자가 전화로 식사, 복약, 몸 상태를 먼저 확인하세요.')
    actions.push('통화가 안 되면 가족 2차 확인 또는 케어파트너 방문확인을 요청하세요.')
  } else if (input.overallState === '주의') {
    actions.push('부모님 안부 응답 시간과 복약 여부를 한 번 더 확인하세요.')
  } else {
    actions.push('현재는 안정적입니다. 정기 안부 루틴을 유지하세요.')
  }

  if (input.burdenScore >= 70) {
    actions.push('부모님 부담도가 높으므로 알림 시간을 줄이거나 “오늘은 쉬고 싶어요” 옵션을 안내하세요.')
  }

  if (input.closureScore < 50) {
    actions.push('무응답 알림 이후 “확인 완료” 기록을 남겨 운영 흐름을 닫으세요.')
  }

  if (input.activeCareRequests > 0) {
    actions.push('진행 중인 케어 요청의 배정·리포트 상태를 확인하세요.')
  }

  if (input.pendingReports > 0) {
    actions.push('보호자 공개 전 케어 리포트 검수를 완료하세요.')
  }

  return Array.from(new Set(actions))
}

export function buildAnbuGraph(input: {
  families: Array<Record<string, unknown>>
  checkins: Array<Record<string, unknown>>
  notifications: Array<Record<string, unknown>>
  consents: Array<Record<string, unknown>>
  consentActions: Array<Record<string, unknown>>
  safetyActions: Array<Record<string, unknown>>
  escalationEvents: Array<Record<string, unknown>>
  careRequests: Array<Record<string, unknown>>
  matches: Array<Record<string, unknown>>
  reports: Array<Record<string, unknown>>
}): AnbuGraphResult {
  const checkinsByFamily = groupByFamily(input.checkins)
  const notificationsByFamily = groupByFamily(input.notifications)
  const consentsByFamily = groupByFamily(input.consents)
  const consentActionsByFamily = groupByFamily(input.consentActions)
  const safetyActionsByFamily = groupByFamily(input.safetyActions)
  const escalationEventsByFamily = groupByFamily(input.escalationEvents)
  const careRequestsByFamily = groupByFamily(input.careRequests)
  const reportsByFamily = groupByFamily(input.reports)

  const graphs: FamilyGraph[] = input.families.map((family) => {
    const familyCode = text(family.family_code)
    const parentName = text(family.parent_name) || '부모님'
    const guardianName = text(family.guardian_name) || '보호자'
    const guardianPhone = text(family.guardian_phone)

    const checkins = checkinsByFamily.get(familyCode) || []
    const notifications = notificationsByFamily.get(familyCode) || []
    const consents = consentsByFamily.get(familyCode) || []
    const consentActions = consentActionsByFamily.get(familyCode) || []
    const safetyActions = safetyActionsByFamily.get(familyCode) || []
    const escalationEvents = escalationEventsByFamily.get(familyCode) || []
    const careRequests = careRequestsByFamily.get(familyCode) || []
    const reports = reportsByFamily.get(familyCode) || []

    const lastCheckinMs = latestDate(checkins, ['occurred_at', 'created_at'])
    const noResponseHours = hoursSince(lastCheckinMs)
    const lastCheckinAt = lastCheckinMs ? new Date(lastCheckinMs).toISOString() : null

    const activeCareRequests = careRequests.filter((row) =>
      ['requested', 'matching', 'assigned', 'reported'].includes(text(row.status) || 'requested')
    ).length

    const pendingReports = reports.filter((row) =>
      ['submitted', 'needs_revision'].includes(text(row.report_status) || 'submitted')
    ).length

    const settings = consentSettings(consents)
    const consentActiveCount = trueCount(settings)
    const consentScore = Math.round((consentActiveCount / 8) * 100)

    const burden = buildBurdenScore({
      notifications,
      consents,
      consentActions,
      safetyActions,
      escalationEvents
    })

    const risk = riskScore({
      checkins,
      notifications,
      escalationEvents,
      careRequests,
      noResponseHours
    })

    const overallState = stateFromRisk(risk)
    const closureScore = closureRate(safetyActions, escalationEvents)
    const report = reportStatus(reports)

    const nodes: GraphNode[] = [
      {
        id: `${familyCode}:parent`,
        kind: 'parent',
        label: parentName,
        status: statusFromState(overallState),
        score: 100 - risk,
        subtitle: '부모님 생활 신호',
        metrics: [
          { label: '최근 안부', value: noResponseHours === null ? '없음' : `${noResponseHours}시간 전` },
          { label: '안부 기록', value: `${checkins.length}건` }
        ]
      },
      {
        id: `${familyCode}:guardian`,
        kind: 'guardian',
        label: guardianName,
        status: 'normal',
        subtitle: '보호자',
        metrics: [
          { label: '연락처', value: guardianPhone || '-' },
          { label: '조치 기록', value: `${safetyActions.length + escalationEvents.length}건` }
        ]
      },
      {
        id: `${familyCode}:consent`,
        kind: 'consent',
        label: '안심동의',
        status: consentScore >= 60 ? 'normal' : 'watch',
        score: consentScore,
        subtitle: '부모님 공유 동의',
        metrics: [
          { label: '허용 항목', value: `${consentActiveCount}/8` },
          { label: '동의 점수', value: `${consentScore}` }
        ]
      },
      {
        id: `${familyCode}:risk`,
        kind: 'risk',
        label: '위험 신호',
        status: statusFromState(overallState),
        score: risk,
        subtitle: overallState,
        metrics: [
          { label: '위험 점수', value: `${risk}` },
          { label: '무응답', value: noResponseHours === null ? '기록 없음' : `${noResponseHours}시간` }
        ]
      },
      {
        id: `${familyCode}:loop`,
        kind: 'safety_loop',
        label: '안심루프',
        status: closureScore >= 70 ? 'done' : closureScore >= 40 ? 'watch' : 'risk',
        score: closureScore,
        subtitle: '확인 완료 엔진',
        metrics: [
          { label: '완료율', value: `${closureScore}%` },
          { label: '조치', value: `${safetyActions.length + escalationEvents.length}건` }
        ]
      },
      {
        id: `${familyCode}:escalation`,
        kind: 'escalation',
        label: '무응답 관리',
        status: escalationEvents.length > 0 ? 'watch' : 'unknown',
        subtitle: '3단계 확인 프로토콜',
        metrics: [
          { label: '이벤트', value: `${escalationEvents.length}건` },
          { label: '최근', value: text(latestRow(escalationEvents)?.action_label) || '-' }
        ]
      },
      {
        id: `${familyCode}:care`,
        kind: 'care_request',
        label: '케어 요청',
        status: activeCareRequests > 0 ? 'watch' : 'unknown',
        subtitle: '케어파트너 실행',
        metrics: [
          { label: '진행 중', value: `${activeCareRequests}건` },
          { label: '전체', value: `${careRequests.length}건` }
        ]
      },
      {
        id: `${familyCode}:report`,
        kind: 'report',
        label: '검수 리포트',
        status: report.status,
        subtitle: report.label,
        metrics: [
          { label: '리포트', value: `${reports.length}건` },
          { label: '검수대기', value: `${pendingReports}건` }
        ]
      },
      {
        id: `${familyCode}:burden`,
        kind: 'burden',
        label: '부담도',
        status: burden.level === '높음' ? 'risk' : burden.level === '보통' ? 'watch' : 'normal',
        score: burden.score,
        subtitle: `부모님 부담도 ${burden.level}`,
        metrics: [
          { label: '부담 점수', value: `${burden.score}` },
          { label: '부담 단계', value: burden.level }
        ]
      }
    ]

    const edges: GraphEdge[] = [
      {
        id: `${familyCode}:parent-consent`,
        from: `${familyCode}:parent`,
        to: `${familyCode}:consent`,
        label: '공유 범위 선택',
        status: consentScore >= 60 ? 'normal' : 'watch'
      },
      {
        id: `${familyCode}:parent-risk`,
        from: `${familyCode}:parent`,
        to: `${familyCode}:risk`,
        label: '생활 신호 분석',
        status: statusFromState(overallState) === 'risk' ? 'risk' : statusFromState(overallState) === 'watch' ? 'watch' : 'normal'
      },
      {
        id: `${familyCode}:risk-loop`,
        from: `${familyCode}:risk`,
        to: `${familyCode}:loop`,
        label: '확인 프로토콜',
        status: risk >= 60 ? 'risk' : risk >= 25 ? 'watch' : 'normal'
      },
      {
        id: `${familyCode}:loop-guardian`,
        from: `${familyCode}:loop`,
        to: `${familyCode}:guardian`,
        label: '보호자 행동',
        status: closureScore >= 70 ? 'done' : 'watch'
      },
      {
        id: `${familyCode}:loop-escalation`,
        from: `${familyCode}:loop`,
        to: `${familyCode}:escalation`,
        label: '무응답 단계',
        status: escalationEvents.length > 0 ? 'watch' : 'normal'
      },
      {
        id: `${familyCode}:escalation-care`,
        from: `${familyCode}:escalation`,
        to: `${familyCode}:care`,
        label: '방문확인 전환',
        status: activeCareRequests > 0 ? 'watch' : 'normal'
      },
      {
        id: `${familyCode}:care-report`,
        from: `${familyCode}:care`,
        to: `${familyCode}:report`,
        label: '현장 리포트',
        status: pendingReports > 0 ? 'watch' : reports.length > 0 ? 'done' : 'normal'
      },
      {
        id: `${familyCode}:parent-burden`,
        from: `${familyCode}:parent`,
        to: `${familyCode}:burden`,
        label: '알림 부담 측정',
        status: burden.level === '높음' ? 'risk' : burden.level === '보통' ? 'watch' : 'normal'
      }
    ]

    return {
      familyCode,
      parentName,
      guardianName,
      guardianPhone,
      overallState,
      riskScore: risk,
      closureScore,
      burdenScore: burden.score,
      burdenLevel: burden.level as '낮음' | '보통' | '높음',
      consentScore,
      noResponseHours,
      lastCheckinAt,
      insights: insightList({
        noResponseHours,
        risk,
        burdenScore: burden.score,
        consentScore,
        closureScore,
        activeCareRequests,
        pendingReports
      }),
      recommendedActions: recommendedActions({
        overallState,
        burdenScore: burden.score,
        closureScore,
        activeCareRequests,
        pendingReports
      }),
      nodes,
      edges,
      raw: {
        family,
        checkins,
        notifications,
        consents,
        safetyActions,
        escalationEvents,
        careRequests,
        matches: input.matches,
        reports
      }
    }
  })

  graphs.sort((a, b) => b.riskScore - a.riskScore)

  const highRisk = graphs.filter((graph) => graph.overallState === '확인 필요').length
  const watch = graphs.filter((graph) => graph.overallState === '주의').length
  const highBurden = graphs.filter((graph) => graph.burdenLevel === '높음').length
  const lowClosure = graphs.filter((graph) => graph.closureScore < 50).length

  const systemInsights: string[] = []

  if (highRisk > 0) systemInsights.push(`${highRisk}가족이 확인 필요 상태입니다.`)
  if (watch > 0) systemInsights.push(`${watch}가족이 주의 상태입니다.`)
  if (highBurden > 0) systemInsights.push(`${highBurden}가족에서 부모님 부담도가 높게 나타났습니다.`)
  if (lowClosure > 0) systemInsights.push(`${lowClosure}가족은 알림 이후 확인 완료율이 낮습니다.`)
  if (systemInsights.length === 0) systemInsights.push('전체 가족 그래프는 현재 안정적인 흐름을 보입니다.')

  return {
    generatedAt: new Date().toISOString(),
    cards: [
      {
        key: 'families',
        label: '가족 그래프',
        value: graphs.length,
        help: '부모님-보호자 연결 단위'
      },
      {
        key: 'risk',
        label: '확인 필요',
        value: highRisk,
        help: '위험 점수 60 이상'
      },
      {
        key: 'burden',
        label: '부담도 높음',
        value: highBurden,
        help: '알림·확인 요구가 많은 가족'
      },
      {
        key: 'closure',
        label: '완료율 낮음',
        value: lowClosure,
        help: '확인 완료율 50% 미만'
      }
    ],
    families: graphs,
    systemInsights,
    rawCounts: {
      families: input.families.length,
      checkins: input.checkins.length,
      notifications: input.notifications.length,
      consents: input.consents.length,
      consentActions: input.consentActions.length,
      safetyActions: input.safetyActions.length,
      escalationEvents: input.escalationEvents.length,
      careRequests: input.careRequests.length,
      matches: input.matches.length,
      reports: input.reports.length
    }
  }
}
