export type EscalationStage = 'normal' | 'stage1' | 'stage2' | 'stage3' | 'help' | 'resolved'

export type EscalationSeverity = 'normal' | 'low' | 'medium' | 'high'

export type EscalationFamily = {
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  stage: EscalationStage
  stageLabel: string
  stageDesc: string
  severity: EscalationSeverity
  elapsedHours: number | null
  lastCheckinAt: string | null
  lastEventAt: string | null
  lastActionType: string | null
  riskReasons: string[]
  recommendedActions: Array<{
    actionType: string
    label: string
    desc: string
    priority: 'normal' | 'important' | 'urgent'
  }>
  activeCareRequests: number
  raw: {
    family: Record<string, unknown>
    checkins: Array<Record<string, unknown>>
    events: Array<Record<string, unknown>>
    notifications: Array<Record<string, unknown>>
    careRequests: Array<Record<string, unknown>>
  }
}

export type EscalationDashboard = {
  generatedAt: string
  cards: Array<{
    key: string
    label: string
    value: number
    help: string
  }>
  families: EscalationFamily[]
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

function actionLabel(actionType: string) {
  if (actionType === 'parent_reprompt') return '부모님 재확인'
  if (actionType === 'guardian_notice') return '보호자 확인 요청'
  if (actionType === 'family_notice') return '가족 2차 확인'
  if (actionType === 'request_partner') return '케어파트너 확인 요청'
  if (actionType === 'mark_resolved') return '확인 완료'
  return actionType
}

function stageLabel(stage: EscalationStage) {
  if (stage === 'resolved') return '확인 완료'
  if (stage === 'help') return '도움 요청'
  if (stage === 'stage3') return '3단계 확인 필요'
  if (stage === 'stage2') return '2단계 보호자 확인'
  if (stage === 'stage1') return '1단계 재확인'
  return '정상'
}

function stageDesc(stage: EscalationStage) {
  if (stage === 'resolved') return '최근 확인 완료 처리된 안심루프입니다.'
  if (stage === 'help') return '부모님이 도움 요청 또는 응급 가능성 신호를 보냈습니다.'
  if (stage === 'stage3') return '12시간 이상 응답이 없어 가족 2차 확인 또는 케어파트너 확인이 필요합니다.'
  if (stage === 'stage2') return '6시간 이상 응답이 없어 보호자 확인 요청이 필요합니다.'
  if (stage === 'stage1') return '3시간 이상 응답이 없어 부모님께 재확인 안내가 필요합니다.'
  return '최근 안부 응답이 있어 정상 범위입니다.'
}

function severity(stage: EscalationStage): EscalationSeverity {
  if (stage === 'help' || stage === 'stage3') return 'high'
  if (stage === 'stage2') return 'medium'
  if (stage === 'stage1') return 'low'
  return 'normal'
}

function hasRecentAction(events: Array<Record<string, unknown>>, actionType: string, withinHours: number) {
  const cutoff = Date.now() - withinHours * 60 * 60 * 1000

  return events.some((event) =>
    text(event.action_type) === actionType &&
    dateMs(event.created_at) >= cutoff
  )
}

function buildRecommendedActions(stage: EscalationStage) {
  if (stage === 'resolved') {
    return [
      {
        actionType: 'parent_reprompt',
        label: '다시 재확인 시작',
        desc: '확인 완료 이후 다시 확인이 필요하면 재확인 단계로 기록합니다.',
        priority: 'normal' as const
      }
    ]
  }

  if (stage === 'normal') {
    return [
      {
        actionType: 'parent_reprompt',
        label: '부모님 재확인 기록',
        desc: '필요 시 부모님께 안부 버튼 재확인을 안내합니다.',
        priority: 'normal' as const
      },
      {
        actionType: 'mark_resolved',
        label: '정상 확인 완료',
        desc: '오늘 안심 상태를 확인 완료로 기록합니다.',
        priority: 'normal' as const
      }
    ]
  }

  if (stage === 'stage1') {
    return [
      {
        actionType: 'parent_reprompt',
        label: '부모님 재확인 요청',
        desc: '부모님께 안부 버튼을 다시 눌러달라고 안내합니다.',
        priority: 'important' as const
      },
      {
        actionType: 'guardian_notice',
        label: '보호자 확인 요청',
        desc: '보호자에게 부모님 상태 확인이 필요함을 기록합니다.',
        priority: 'important' as const
      },
      {
        actionType: 'mark_resolved',
        label: '확인 완료',
        desc: '전화 등으로 확인했다면 완료 처리합니다.',
        priority: 'normal' as const
      }
    ]
  }

  if (stage === 'stage2') {
    return [
      {
        actionType: 'guardian_notice',
        label: '보호자 확인 요청',
        desc: '보호자가 전화 또는 가족 연락으로 확인하도록 요청합니다.',
        priority: 'important' as const
      },
      {
        actionType: 'family_notice',
        label: '가족 2차 확인',
        desc: '가까운 가족이나 지인에게 2차 확인을 요청합니다.',
        priority: 'important' as const
      },
      {
        actionType: 'request_partner',
        label: '케어파트너 확인 요청',
        desc: '현장 확인이 필요하면 케어파트너 방문확인으로 전환합니다.',
        priority: 'urgent' as const
      },
      {
        actionType: 'mark_resolved',
        label: '확인 완료',
        desc: '상태를 확인했다면 완료 처리합니다.',
        priority: 'normal' as const
      }
    ]
  }

  return [
    {
      actionType: 'guardian_notice',
      label: '보호자 즉시 확인',
      desc: '보호자에게 즉시 전화 확인을 요청합니다.',
      priority: 'urgent' as const
    },
    {
      actionType: 'family_notice',
      label: '가족 2차 확인',
      desc: '가까운 가족 또는 지인에게 확인 요청을 기록합니다.',
      priority: 'urgent' as const
    },
    {
      actionType: 'request_partner',
      label: '케어파트너 방문확인',
      desc: '현장 확인이 필요하면 케어파트너 방문확인을 요청합니다.',
      priority: 'urgent' as const
    },
    {
      actionType: 'mark_resolved',
      label: '확인 완료',
      desc: '부모님 상태를 확인했다면 안심루프를 완료합니다.',
      priority: 'important' as const
    }
  ]
}

export function buildEscalationDashboard(input: {
  families: Array<Record<string, unknown>>
  checkins: Array<Record<string, unknown>>
  notifications: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
  careRequests: Array<Record<string, unknown>>
}): EscalationDashboard {
  const checkinsByFamily = groupByFamily(input.checkins)
  const notificationsByFamily = groupByFamily(input.notifications)
  const eventsByFamily = groupByFamily(input.events)
  const careRequestsByFamily = groupByFamily(input.careRequests)

  const families = input.families.map((family) => {
    const familyCode = text(family.family_code)
    const parentName = text(family.parent_name) || '부모님'
    const guardianName = text(family.guardian_name) || '보호자'
    const guardianPhone = text(family.guardian_phone)

    const checkins = checkinsByFamily.get(familyCode) || []
    const notifications = notificationsByFamily.get(familyCode) || []
    const events = eventsByFamily.get(familyCode) || []
    const careRequests = careRequestsByFamily.get(familyCode) || []

    const lastCheckinMs = latestDate(checkins, ['occurred_at', 'created_at'])
    const lastEventMs = latestDate(events, ['created_at', 'updated_at'])
    const elapsed = hoursSince(lastCheckinMs)

    const lastEvent = events
      .slice()
      .sort((a, b) => dateMs(b.created_at) - dateMs(a.created_at))[0]

    const lastActionType = text(lastEvent?.action_type)

    const helpSignal = checkins.some((row) =>
      ['needs_help'].includes(text(row.status)) ||
      text(row.check_type) === 'emergency' ||
      text(row.care_label).includes('도움') ||
      text(row.memo).includes('도움') ||
      text(row.memo).includes('응급')
    )

    const resolvedRecently = hasRecentAction(events, 'mark_resolved', 24)

    let stage: EscalationStage = 'normal'

    if (resolvedRecently) {
      stage = 'resolved'
    } else if (helpSignal) {
      stage = 'help'
    } else if (!lastCheckinMs) {
      stage = 'stage3'
    } else if ((elapsed || 0) >= 12) {
      stage = 'stage3'
    } else if ((elapsed || 0) >= 6) {
      stage = 'stage2'
    } else if ((elapsed || 0) >= 3) {
      stage = 'stage1'
    }

    const activeCareRequests = careRequests.filter((row) =>
      ['requested', 'matching', 'assigned', 'reported'].includes(text(row.status) || 'requested')
    ).length

    const riskReasons: string[] = []

    if (!lastCheckinMs) riskReasons.push('최근 안부 기록이 없습니다.')
    if (elapsed !== null && elapsed >= 3) riskReasons.push(`마지막 안부 후 ${elapsed}시간이 지났습니다.`)
    if (helpSignal) riskReasons.push('도움 요청 또는 응급 가능성 표현이 있습니다.')
    if (notifications.some((row) => text(row.reason).includes('no-response') || text(row.title).includes('응답 없음'))) {
      riskReasons.push('무응답 알림이 발생했습니다.')
    }
    if (activeCareRequests > 0) riskReasons.push(`진행 중인 케어 요청이 ${activeCareRequests}건 있습니다.`)

    if (riskReasons.length === 0) riskReasons.push('현재 특별한 위험 사유가 없습니다.')

    return {
      familyCode,
      parentName,
      guardianName,
      guardianPhone,
      stage,
      stageLabel: stageLabel(stage),
      stageDesc: stageDesc(stage),
      severity: severity(stage),
      elapsedHours: elapsed,
      lastCheckinAt: lastCheckinMs ? new Date(lastCheckinMs).toISOString() : null,
      lastEventAt: lastEventMs ? new Date(lastEventMs).toISOString() : null,
      lastActionType,
      riskReasons,
      recommendedActions: buildRecommendedActions(stage),
      activeCareRequests,
      raw: {
        family,
        checkins,
        events,
        notifications,
        careRequests
      }
    }
  })

  families.sort((a, b) => {
    const weight = { help: 5, stage3: 4, stage2: 3, stage1: 2, normal: 1, resolved: 0 }
    return (weight[b.stage] || 0) - (weight[a.stage] || 0)
  })

  return {
    generatedAt: new Date().toISOString(),
    cards: [
      {
        key: 'stage3',
        label: '3단계 확인 필요',
        value: families.filter((item) => item.stage === 'stage3' || item.stage === 'help').length,
        help: '12시간 이상 무응답 또는 도움 요청'
      },
      {
        key: 'stage2',
        label: '2단계 보호자 확인',
        value: families.filter((item) => item.stage === 'stage2').length,
        help: '6시간 이상 무응답'
      },
      {
        key: 'stage1',
        label: '1단계 재확인',
        value: families.filter((item) => item.stage === 'stage1').length,
        help: '3시간 이상 무응답'
      },
      {
        key: 'normal',
        label: '정상/완료',
        value: families.filter((item) => item.stage === 'normal' || item.stage === 'resolved').length,
        help: '최근 응답 또는 확인 완료'
      }
    ],
    families,
    rawCounts: {
      families: input.families.length,
      checkins: input.checkins.length,
      notifications: input.notifications.length,
      events: input.events.length,
      careRequests: input.careRequests.length
    }
  }
}

export function escalationActionLabel(actionType: string) {
  return actionLabel(actionType)
}
