export type AnbuGraphNodeType =
  | 'parent'
  | 'guardian'
  | 'consent'
  | 'checkin'
  | 'risk'
  | 'safety_loop'
  | 'escalation'
  | 'care_request'
  | 'partner'
  | 'care_report'
  | 'notification'
  | 'burden'
  | 'subscription'

export type AnbuGraphNode = {
  id: string
  type: AnbuGraphNodeType
  title: string
  subtitle: string
  metric: string
  status: 'normal' | 'warning' | 'danger' | 'done' | 'empty'
  priority: number
}

export type AnbuGraphEdge = {
  id: string
  from: string
  to: string
  label: string
  description: string
  status: 'normal' | 'warning' | 'danger' | 'done'
}

export type AnbuGraphInsight = {
  type: 'risk' | 'burden' | 'closure' | 'consent' | 'opportunity'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

export type AnbuGraphFamilySummary = {
  familyCode: string
  parentName: string
  guardianName: string
  graphStatus: '정상' | '주의' | '확인 필요'
  riskScore: number
  burdenScore: number
  closureScore: number
  lastCheckinAt: string | null
}

export type AnbuGraphResult = {
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  graphStatus: '정상' | '주의' | '확인 필요'
  riskScore: number
  burdenScore: number
  closureScore: number
  generatedAt: string
  nodes: AnbuGraphNode[]
  edges: AnbuGraphEdge[]
  insights: AnbuGraphInsight[]
  metrics: Array<{
    label: string
    value: string
    help: string
  }>
  familySummaries: AnbuGraphFamilySummary[]
  raw: {
    family: Record<string, unknown> | null
    checkins: Array<Record<string, unknown>>
    notifications: Array<Record<string, unknown>>
    consents: Array<Record<string, unknown>>
    consentActions: Array<Record<string, unknown>>
    safetyActions: Array<Record<string, unknown>>
    escalationEvents: Array<Record<string, unknown>>
    careRequests: Array<Record<string, unknown>>
    partnerMatches: Array<Record<string, unknown>>
    taskReports: Array<Record<string, unknown>>
    partners: Array<Record<string, unknown>>
    subscriptions: Array<Record<string, unknown>>
  }
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

function latestDate(rows: Array<Record<string, unknown>>, keys: string[]) {
  let latest = 0

  for (const row of rows) {
    for (const key of keys) {
      latest = Math.max(latest, dateMs(row[key]))
    }
  }

  return latest
}

function hoursSince(ms: number) {
  if (!ms) return null
  const hours = (Date.now() - ms) / (1000 * 60 * 60)
  return Math.max(0, Math.round(hours * 10) / 10)
}

function isWithinHours(row: Record<string, unknown>, hours: number) {
  const raw =
    row.occurred_at ||
    row.created_at ||
    row.updated_at ||
    row.sent_at ||
    row.performed_at

  const ms = dateMs(raw)
  if (!ms) return false

  return ms >= Date.now() - hours * 60 * 60 * 1000
}

function count<T>(rows: T[], predicate: (row: T) => boolean) {
  return rows.filter(predicate).length
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

function statusFromScore(score: number): '정상' | '주의' | '확인 필요' {
  if (score >= 70) return '확인 필요'
  if (score >= 35) return '주의'
  return '정상'
}

function nodeStatusFromGraph(status: '정상' | '주의' | '확인 필요') {
  if (status === '확인 필요') return 'danger' as const
  if (status === '주의') return 'warning' as const
  return 'normal' as const
}

function safePercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function summarizeFamily(input: {
  family: Record<string, unknown>
  checkins: Array<Record<string, unknown>>
  notifications: Array<Record<string, unknown>>
  consents: Array<Record<string, unknown>>
  consentActions: Array<Record<string, unknown>>
  safetyActions: Array<Record<string, unknown>>
  escalationEvents: Array<Record<string, unknown>>
  careRequests: Array<Record<string, unknown>>
  taskReports: Array<Record<string, unknown>>
}) {
  const familyCode = text(input.family.family_code)
  const parentName = text(input.family.parent_name) || '부모님'
  const guardianName = text(input.family.guardian_name) || '보호자'

  const lastCheckinMs = latestDate(input.checkins, ['occurred_at', 'created_at'])
  const elapsed = hoursSince(lastCheckinMs)

  const checkins24 = input.checkins.filter((row) => isWithinHours(row, 24))
  const notifications24 = input.notifications.filter((row) => isWithinHours(row, 24))
  const consentActions7d = input.consentActions.filter((row) => isWithinHours(row, 24 * 7))
  const safetyActions7d = input.safetyActions.filter((row) => isWithinHours(row, 24 * 7))
  const escalationEvents7d = input.escalationEvents.filter((row) => isWithinHours(row, 24 * 7))
  const taskReports7d = input.taskReports.filter((row) => isWithinHours(row, 24 * 7))

  const missed =
    count(checkins24, (row) => ['not_done', 'needs_help'].includes(text(row.status))) +
    count(input.escalationEvents, (row) => ['stage2', 'stage3', 'help'].includes(text(row.stage)))

  const helpSignals = count(checkins24, (row) =>
    text(row.status) === 'needs_help' ||
    text(row.check_type) === 'emergency' ||
    text(row.memo).includes('도움') ||
    text(row.memo).includes('응급')
  )

  let riskScore = 0
  if (!lastCheckinMs) riskScore += 55
  if (elapsed !== null && elapsed >= 12) riskScore += 45
  else if (elapsed !== null && elapsed >= 6) riskScore += 28
  else if (elapsed !== null && elapsed >= 3) riskScore += 16
  riskScore += missed * 14
  riskScore += helpSignals * 35
  riskScore += count(notifications24, (row) => text(row.reason).includes('no-response') || text(row.title).includes('응답 없음')) * 12
  riskScore = safePercent(riskScore)

  const restSignals = count(consentActions7d, (row) =>
    ['rest_today', 'reply_later'].includes(text(row.action_type))
  )

  let burdenScore = 0
  burdenScore += notifications24.length * 8
  burdenScore += restSignals * 15
  burdenScore += count(consentActions7d, (row) => text(row.action_type) === 'help_needed') * 18
  burdenScore = safePercent(burdenScore)

  const completedActions =
    count(safetyActions7d, (row) => ['mark_complete', 'mark_resolved'].includes(text(row.action_type))) +
    count(escalationEvents7d, (row) => ['mark_resolved'].includes(text(row.action_type))) +
    taskReports7d.length

  const openCareRequests = count(input.careRequests, (row) =>
    ['requested', 'matching', 'assigned', 'reported'].includes(text(row.status) || 'requested')
  )

  let closureScore = 50
  closureScore += completedActions * 12
  closureScore -= openCareRequests * 12
  closureScore -= riskScore > 60 ? 20 : 0
  closureScore = safePercent(closureScore)

  const graphStatus = statusFromScore(riskScore)

  return {
    familyCode,
    parentName,
    guardianName,
    graphStatus,
    riskScore,
    burdenScore,
    closureScore,
    lastCheckinAt: lastCheckinMs ? new Date(lastCheckinMs).toISOString() : null
  }
}

export function buildAnbuGraph(input: {
  requestedFamilyCode?: string
  families: Array<Record<string, unknown>>
  checkins: Array<Record<string, unknown>>
  notifications: Array<Record<string, unknown>>
  consents: Array<Record<string, unknown>>
  consentActions: Array<Record<string, unknown>>
  safetyActions: Array<Record<string, unknown>>
  escalationEvents: Array<Record<string, unknown>>
  careRequests: Array<Record<string, unknown>>
  partnerMatches: Array<Record<string, unknown>>
  taskReports: Array<Record<string, unknown>>
  partners: Array<Record<string, unknown>>
  subscriptions: Array<Record<string, unknown>>
}): AnbuGraphResult {
  const checkinsByFamily = groupByFamily(input.checkins)
  const notificationsByFamily = groupByFamily(input.notifications)
  const consentsByFamily = groupByFamily(input.consents)
  const consentActionsByFamily = groupByFamily(input.consentActions)
  const safetyActionsByFamily = groupByFamily(input.safetyActions)
  const escalationEventsByFamily = groupByFamily(input.escalationEvents)
  const careRequestsByFamily = groupByFamily(input.careRequests)
  const taskReportsByFamily = groupByFamily(input.taskReports)
  const subscriptionsByFamily = groupByFamily(input.subscriptions)

  const familySummaries = input.families.map((family) =>
    summarizeFamily({
      family,
      checkins: checkinsByFamily.get(text(family.family_code)) || [],
      notifications: notificationsByFamily.get(text(family.family_code)) || [],
      consents: consentsByFamily.get(text(family.family_code)) || [],
      consentActions: consentActionsByFamily.get(text(family.family_code)) || [],
      safetyActions: safetyActionsByFamily.get(text(family.family_code)) || [],
      escalationEvents: escalationEventsByFamily.get(text(family.family_code)) || [],
      careRequests: careRequestsByFamily.get(text(family.family_code)) || [],
      taskReports: taskReportsByFamily.get(text(family.family_code)) || []
    })
  )

  familySummaries.sort((a, b) => b.riskScore - a.riskScore)

  const selectedFamily =
    input.families.find((family) => text(family.family_code) === input.requestedFamilyCode) ||
    input.families.find((family) => text(family.family_code) === familySummaries[0]?.familyCode) ||
    input.families[0] ||
    null

  const familyCode = text(selectedFamily?.family_code)
  const parentName = text(selectedFamily?.parent_name) || '부모님'
  const guardianName = text(selectedFamily?.guardian_name) || '보호자'
  const guardianPhone = text(selectedFamily?.guardian_phone)

  const checkins = checkinsByFamily.get(familyCode) || []
  const notifications = notificationsByFamily.get(familyCode) || []
  const consents = consentsByFamily.get(familyCode) || []
  const consentActions = consentActionsByFamily.get(familyCode) || []
  const safetyActions = safetyActionsByFamily.get(familyCode) || []
  const escalationEvents = escalationEventsByFamily.get(familyCode) || []
  const careRequests = careRequestsByFamily.get(familyCode) || []
  const taskReports = taskReportsByFamily.get(familyCode) || []
  const subscriptions = subscriptionsByFamily.get(familyCode) || []

  const summary = selectedFamily
    ? summarizeFamily({
        family: selectedFamily,
        checkins,
        notifications,
        consents,
        consentActions,
        safetyActions,
        escalationEvents,
        careRequests,
        taskReports
      })
    : {
        familyCode: '',
        parentName: '부모님',
        guardianName: '보호자',
        graphStatus: '정상' as const,
        riskScore: 0,
        burdenScore: 0,
        closureScore: 0,
        lastCheckinAt: null
      }

  const checkins24 = checkins.filter((row) => isWithinHours(row, 24))
  const notifications24 = notifications.filter((row) => isWithinHours(row, 24))
  const careRequestsOpen = careRequests.filter((row) =>
    ['requested', 'matching', 'assigned', 'reported'].includes(text(row.status) || 'requested')
  )

  const consentSettings = typeof consents[0]?.consent_settings === 'object'
    ? consents[0]?.consent_settings as Record<string, unknown>
    : {}

  const enabledConsents = Object.values(consentSettings).filter(Boolean).length

  const nodes: AnbuGraphNode[] = [
    {
      id: 'parent',
      type: 'parent',
      title: parentName,
      subtitle: '고령 부모님',
      metric: summary.lastCheckinAt ? '안부 기록 있음' : '안부 기록 없음',
      status: nodeStatusFromGraph(summary.graphStatus),
      priority: 1
    },
    {
      id: 'guardian',
      type: 'guardian',
      title: guardianName,
      subtitle: guardianPhone || '보호자',
      metric: '확인 책임자',
      status: 'normal',
      priority: 2
    },
    {
      id: 'consent',
      type: 'consent',
      title: '안심동의',
      subtitle: '부모님 공유 설정',
      metric: `${enabledConsents}개 공유 허용`,
      status: enabledConsents > 0 ? 'done' : 'warning',
      priority: 3
    },
    {
      id: 'checkin',
      type: 'checkin',
      title: '안부 신호',
      subtitle: '식사·복약·몸상태',
      metric: `24시간 ${checkins24.length}건`,
      status: checkins24.length > 0 ? 'normal' : 'warning',
      priority: 4
    },
    {
      id: 'risk',
      type: 'risk',
      title: '위험 신호',
      subtitle: '무응답·도움요청·누락',
      metric: `위험점수 ${summary.riskScore}`,
      status: summary.riskScore >= 70 ? 'danger' : summary.riskScore >= 35 ? 'warning' : 'normal',
      priority: 5
    },
    {
      id: 'safety-loop',
      type: 'safety_loop',
      title: '안심루프',
      subtitle: '확인 완료 추적',
      metric: `완료율 ${summary.closureScore}%`,
      status: summary.closureScore >= 70 ? 'done' : summary.closureScore >= 40 ? 'warning' : 'danger',
      priority: 6
    },
    {
      id: 'escalation',
      type: 'escalation',
      title: '무응답 단계',
      subtitle: '3h·6h·12h 프로토콜',
      metric: `${escalationEvents.length}건`,
      status: escalationEvents.some((row) => ['stage3', 'help'].includes(text(row.stage))) ? 'danger' : escalationEvents.length > 0 ? 'warning' : 'empty',
      priority: 7
    },
    {
      id: 'care-request',
      type: 'care_request',
      title: '케어 요청',
      subtitle: '방문확인·병원동행',
      metric: `진행 ${careRequestsOpen.length}건`,
      status: careRequestsOpen.length > 0 ? 'warning' : 'empty',
      priority: 8
    },
    {
      id: 'partner',
      type: 'partner',
      title: '케어파트너',
      subtitle: '현장 확인 실행',
      metric: `${input.partners.length}명 후보`,
      status: input.partners.length > 0 ? 'normal' : 'empty',
      priority: 9
    },
    {
      id: 'care-report',
      type: 'care_report',
      title: '검수 리포트',
      subtitle: '운영실 품질검수',
      metric: `${taskReports.length}건`,
      status: taskReports.some((row) => text(row.report_status) === 'approved') ? 'done' : taskReports.length > 0 ? 'warning' : 'empty',
      priority: 10
    },
    {
      id: 'notification',
      type: 'notification',
      title: '알림 이력',
      subtitle: 'SMS·알림톡·발송함',
      metric: `24시간 ${notifications24.length}건`,
      status: notifications24.some((row) => text(row.status) === 'failed') ? 'warning' : notifications24.length > 0 ? 'normal' : 'empty',
      priority: 11
    },
    {
      id: 'burden',
      type: 'burden',
      title: '부모님 부담도',
      subtitle: '알림 피로·쉬고싶음',
      metric: `${summary.burdenScore}점`,
      status: summary.burdenScore >= 70 ? 'danger' : summary.burdenScore >= 35 ? 'warning' : 'normal',
      priority: 12
    },
    {
      id: 'subscription',
      type: 'subscription',
      title: '구독·실증',
      subtitle: '체험·기관 실증',
      metric: `${subscriptions.length}건`,
      status: subscriptions.some((row) => ['trial', 'active', 'paid'].includes(text(row.status))) ? 'done' : 'empty',
      priority: 13
    }
  ]

  const edges: AnbuGraphEdge[] = [
    {
      id: 'guardian-parent',
      from: 'guardian',
      to: 'parent',
      label: '가족 연결',
      description: '보호자와 부모님이 가족코드로 연결됩니다.',
      status: familyCode ? 'done' : 'warning'
    },
    {
      id: 'parent-consent',
      from: 'parent',
      to: 'consent',
      label: '동의 기반 공유',
      description: '부모님이 자녀에게 공유할 정보를 직접 선택합니다.',
      status: enabledConsents > 0 ? 'done' : 'warning'
    },
    {
      id: 'parent-checkin',
      from: 'parent',
      to: 'checkin',
      label: '일상 신호 수집',
      description: '식사, 복약, 몸 상태, 도움 요청이 안부 신호로 쌓입니다.',
      status: checkins24.length > 0 ? 'normal' : 'warning'
    },
    {
      id: 'checkin-risk',
      from: 'checkin',
      to: 'risk',
      label: '위험 신호 분석',
      description: '무응답, 복약 누락, 도움 요청을 위험 신호로 분류합니다.',
      status: summary.riskScore >= 70 ? 'danger' : summary.riskScore >= 35 ? 'warning' : 'normal'
    },
    {
      id: 'risk-safety',
      from: 'risk',
      to: 'safety-loop',
      label: '확인 완료 루프',
      description: '위험 신호를 보호자 행동과 확인 완료 상태로 연결합니다.',
      status: summary.closureScore >= 70 ? 'done' : 'warning'
    },
    {
      id: 'safety-escalation',
      from: 'safety-loop',
      to: 'escalation',
      label: '무응답 단계화',
      description: '3시간, 6시간, 12시간 이상 무응답을 단계별로 관리합니다.',
      status: escalationEvents.length > 0 ? 'warning' : 'normal'
    },
    {
      id: 'escalation-care',
      from: 'escalation',
      to: 'care-request',
      label: '현장 확인 전환',
      description: '필요 시 케어파트너 방문확인으로 전환합니다.',
      status: careRequestsOpen.length > 0 ? 'warning' : 'normal'
    },
    {
      id: 'care-partner',
      from: 'care-request',
      to: 'partner',
      label: '케어파트너 배정',
      description: '지역과 업무 유형에 맞는 파트너를 연결합니다.',
      status: input.partners.length > 0 ? 'normal' : 'warning'
    },
    {
      id: 'partner-report',
      from: 'partner',
      to: 'care-report',
      label: '검수형 리포트',
      description: '현장 확인 결과는 운영실 검수 후 보호자에게 공개됩니다.',
      status: taskReports.length > 0 ? 'done' : 'normal'
    },
    {
      id: 'notification-guardian',
      from: 'notification',
      to: 'guardian',
      label: '보호자 알림',
      description: '무응답과 확인 필요 신호를 보호자에게 전달합니다.',
      status: notifications24.length > 0 ? 'normal' : 'warning'
    },
    {
      id: 'burden-consent',
      from: 'burden',
      to: 'consent',
      label: '부담도 기반 조정',
      description: '부모님 부담도가 높으면 알림 빈도와 공유 범위를 조정합니다.',
      status: summary.burdenScore >= 70 ? 'danger' : summary.burdenScore >= 35 ? 'warning' : 'normal'
    }
  ]

  const insights: AnbuGraphInsight[] = []

  if (summary.riskScore >= 70) {
    insights.push({
      type: 'risk',
      title: '확인 필요 위험 신호',
      description: '무응답, 도움 요청, 복약 누락 등으로 위험점수가 높습니다. 보호자 확인 또는 케어파트너 확인을 권장합니다.',
      severity: 'high'
    })
  } else if (summary.riskScore >= 35) {
    insights.push({
      type: 'risk',
      title: '주의 신호',
      description: '최근 안부 패턴에서 일부 확인이 필요한 신호가 있습니다.',
      severity: 'medium'
    })
  }

  if (summary.burdenScore >= 50) {
    insights.push({
      type: 'burden',
      title: '부모님 부담도 상승',
      description: '알림 횟수나 쉬고 싶다는 선택이 늘었습니다. 알림 시간과 빈도를 조정하는 것이 좋습니다.',
      severity: summary.burdenScore >= 70 ? 'high' : 'medium'
    })
  }

  if (enabledConsents === 0) {
    insights.push({
      type: 'consent',
      title: '동의 설정 필요',
      description: '부모님 공유 동의 설정이 없습니다. 감시가 아닌 선택형 공유 구조를 안내하세요.',
      severity: 'medium'
    })
  }

  if (summary.closureScore < 45 && summary.riskScore > 35) {
    insights.push({
      type: 'closure',
      title: '확인 완료율 개선 필요',
      description: '위험 신호가 확인 완료까지 닫히지 않고 있습니다. 보호자 조치 기록과 케어파트너 전환을 강화하세요.',
      severity: 'high'
    })
  }

  if (insights.length === 0) {
    insights.push({
      type: 'opportunity',
      title: '안심 그래프 정상',
      description: '현재 주요 위험 신호는 낮습니다. 부모님 안심동의와 안부 루틴을 유지하세요.',
      severity: 'low'
    })
  }

  return {
    familyCode,
    parentName,
    guardianName,
    guardianPhone,
    graphStatus: summary.graphStatus,
    riskScore: summary.riskScore,
    burdenScore: summary.burdenScore,
    closureScore: summary.closureScore,
    generatedAt: new Date().toISOString(),
    nodes: nodes.sort((a, b) => a.priority - b.priority),
    edges,
    insights,
    metrics: [
      {
        label: '위험점수',
        value: `${summary.riskScore}`,
        help: '무응답·도움요청·누락 기반'
      },
      {
        label: '부모님 부담도',
        value: `${summary.burdenScore}`,
        help: '알림 피로·쉬고싶음·응답 부담'
      },
      {
        label: '확인 완료율',
        value: `${summary.closureScore}%`,
        help: '위험 신호가 확인 완료까지 닫힌 정도'
      },
      {
        label: '24시간 안부',
        value: `${checkins24.length}건`,
        help: '식사·복약·몸상태·도움요청'
      },
      {
        label: '공유 동의',
        value: `${enabledConsents}개`,
        help: '부모님이 허용한 공유 항목'
      },
      {
        label: '진행 케어',
        value: `${careRequestsOpen.length}건`,
        help: '방문확인·병원동행 등'
      }
    ],
    familySummaries,
    raw: {
      family: selectedFamily,
      checkins,
      notifications,
      consents,
      consentActions,
      safetyActions,
      escalationEvents,
      careRequests,
      partnerMatches: input.partnerMatches,
      taskReports,
      partners: input.partners,
      subscriptions
    }
  }
}
