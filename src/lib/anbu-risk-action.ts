export type RiskLevel = 'normal' | 'watch' | 'risk' | 'urgent'
export type ActionPriority = 'normal' | 'important' | 'urgent'

export type RiskSignal = {
  type:
    | 'no_response'
    | 'meal'
    | 'medication'
    | 'condition'
    | 'emergency'
    | 'schedule'
    | 'consent'
    | 'burden'
    | 'care_request'
    | 'report'
  level: RiskLevel
  title: string
  description: string
}

export type RiskAction = {
  actionType: string
  label: string
  description: string
  priority: ActionPriority
  buttonLabel: string
}

export type RiskActionGuide = {
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  riskLevel: RiskLevel
  riskScore: number
  primarySituation: string
  summary: string
  signals: RiskSignal[]
  confirmationQuestions: string[]
  callScript: string
  guardianMessage: string
  carePartnerBrief: string
  nextActions: RiskAction[]
  safetyNote: string
  raw: {
    family: Record<string, unknown>
    checkins: Array<Record<string, unknown>>
    consents: Array<Record<string, unknown>>
    consentActions: Array<Record<string, unknown>>
    safetyActions: Array<Record<string, unknown>>
    escalationEvents: Array<Record<string, unknown>>
    careRequests: Array<Record<string, unknown>>
    reports: Array<Record<string, unknown>>
    schedules: Array<Record<string, unknown>>
  }
}

export type RiskActionDashboard = {
  generatedAt: string
  cards: Array<{
    key: string
    label: string
    value: number
    help: string
  }>
  guides: RiskActionGuide[]
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

function count<T>(rows: T[], predicate: (row: T) => boolean) {
  return rows.filter(predicate).length
}

function latestRow(rows: Array<Record<string, unknown>>, keys = ['updated_at', 'created_at']) {
  return rows
    .slice()
    .sort((a, b) => latestDate([b], keys) - latestDate([a], keys))[0] || null
}

function todayKst() {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 75) return 'urgent'
  if (score >= 55) return 'risk'
  if (score >= 25) return 'watch'
  return 'normal'
}

function priorityFromLevel(level: RiskLevel): ActionPriority {
  if (level === 'urgent' || level === 'risk') return 'urgent'
  if (level === 'watch') return 'important'
  return 'normal'
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}

function consentSettings(consents: Array<Record<string, unknown>>) {
  const row = latestRow(consents)
  const raw = row?.consent_settings

  if (raw && typeof raw === 'object') {
    return raw as Record<string, unknown>
  }

  return {}
}

function activeCareRequests(rows: Array<Record<string, unknown>>) {
  return rows.filter((row) =>
    ['requested', 'matching', 'assigned', 'reported'].includes(text(row.status) || 'requested')
  )
}

function pendingReports(rows: Array<Record<string, unknown>>) {
  return rows.filter((row) =>
    ['submitted', 'needs_revision'].includes(text(row.report_status) || 'submitted')
  )
}

function buildSignals(input: {
  noResponseHours: number | null
  checkins: Array<Record<string, unknown>>
  consents: Array<Record<string, unknown>>
  consentActions: Array<Record<string, unknown>>
  escalationEvents: Array<Record<string, unknown>>
  careRequests: Array<Record<string, unknown>>
  reports: Array<Record<string, unknown>>
  schedules: Array<Record<string, unknown>>
}) {
  const signals: RiskSignal[] = []

  if (input.noResponseHours === null) {
    signals.push({
      type: 'no_response',
      level: 'risk',
      title: '최근 안부 기록 없음',
      description: '부모님의 최근 안부 응답 기록이 없어 최초 연결 또는 재확인이 필요합니다.'
    })
  } else if (input.noResponseHours >= 12) {
    signals.push({
      type: 'no_response',
      level: 'urgent',
      title: '12시간 이상 무응답',
      description: `마지막 안부 응답 후 ${input.noResponseHours}시간이 지났습니다. 보호자 확인 또는 가족 2차 확인이 필요합니다.`
    })
  } else if (input.noResponseHours >= 6) {
    signals.push({
      type: 'no_response',
      level: 'risk',
      title: '6시간 이상 무응답',
      description: `마지막 안부 응답 후 ${input.noResponseHours}시간이 지났습니다. 보호자 확인을 권장합니다.`
    })
  } else if (input.noResponseHours >= 3) {
    signals.push({
      type: 'no_response',
      level: 'watch',
      title: '3시간 이상 무응답',
      description: `마지막 안부 응답 후 ${input.noResponseHours}시간이 지났습니다. 부모님께 재확인을 안내할 수 있습니다.`
    })
  }

  const mealMissed = count(input.checkins, (row) =>
    text(row.check_type) === 'meal' &&
    ['not_done', 'needs_help'].includes(text(row.status))
  )

  const medicationMissed = count(input.checkins, (row) =>
    text(row.check_type) === 'medication' &&
    ['not_done', 'needs_help'].includes(text(row.status))
  )

  const conditionRisk = count(input.checkins, (row) =>
    text(row.check_type) === 'condition' &&
    ['not_done', 'needs_help'].includes(text(row.status))
  )

  const emergency = count(input.checkins, (row) =>
    text(row.check_type) === 'emergency' ||
    text(row.status) === 'needs_help' ||
    text(row.care_label).includes('도움') ||
    text(row.memo).includes('응급') ||
    text(row.memo).includes('도움')
  )

  if (mealMissed > 0) {
    signals.push({
      type: 'meal',
      level: 'watch',
      title: '식사 확인 필요',
      description: `최근 식사 미확인 또는 식사 못함 기록이 ${mealMissed}회 있습니다.`
    })
  }

  if (medicationMissed > 0) {
    signals.push({
      type: 'medication',
      level: 'risk',
      title: '복약 확인 필요',
      description: `최근 복약 미확인 또는 복약 누락 기록이 ${medicationMissed}회 있습니다.`
    })
  }

  if (conditionRisk > 0) {
    signals.push({
      type: 'condition',
      level: 'risk',
      title: '몸 상태 확인 필요',
      description: `몸 상태 확인 필요 신호가 ${conditionRisk}회 있습니다.`
    })
  }

  if (emergency > 0) {
    signals.push({
      type: 'emergency',
      level: 'urgent',
      title: '도움 요청 또는 응급 가능성 신호',
      description: '부모님이 도움이 필요하다는 신호를 보냈거나 응급 관련 표현이 감지되었습니다.'
    })
  }

  const today = todayKst()
  const todaySchedules = input.schedules.filter((row) => text(row.schedule_date) === today)

  if (todaySchedules.length > 0) {
    signals.push({
      type: 'schedule',
      level: 'watch',
      title: '오늘 일정 확인 필요',
      description: `오늘 등록된 병원·복약·돌봄 일정이 ${todaySchedules.length}건 있습니다.`
    })
  }

  const settings = consentSettings(input.consents)
  const locationOff = settings.shareLocation === false
  const photoOff = settings.sharePhoto === false

  if (locationOff || photoOff) {
    signals.push({
      type: 'consent',
      level: 'normal',
      title: '선택형 공유 설정',
      description: '부모님이 위치 또는 사진 공유를 선택하지 않았습니다. 동의 범위 안에서만 확인해야 합니다.'
    })
  }

  const restOrLater = input.consentActions.filter((row) =>
    ['rest_today', 'reply_later'].includes(text(row.action_type))
  ).length

  if (restOrLater >= 2) {
    signals.push({
      type: 'burden',
      level: 'watch',
      title: '부모님 부담도 확인 필요',
      description: `최근 “오늘은 쉬고 싶어요” 또는 “나중에 답할게요” 선택이 ${restOrLater}회 있습니다.`
    })
  }

  const activeCare = activeCareRequests(input.careRequests)

  if (activeCare.length > 0) {
    signals.push({
      type: 'care_request',
      level: 'watch',
      title: '케어 요청 진행 중',
      description: `진행 중인 케어 요청이 ${activeCare.length}건 있습니다.`
    })
  }

  const reports = pendingReports(input.reports)

  if (reports.length > 0) {
    signals.push({
      type: 'report',
      level: 'watch',
      title: '리포트 검수 필요',
      description: `보호자 공개 전 검수해야 할 리포트가 ${reports.length}건 있습니다.`
    })
  }

  return signals
}

function scoreFromSignals(signals: RiskSignal[]) {
  let score = 0

  for (const signal of signals) {
    if (signal.level === 'urgent') score += 35
    else if (signal.level === 'risk') score += 24
    else if (signal.level === 'watch') score += 12
    else score += 2
  }

  return Math.max(0, Math.min(100, score))
}

function primarySituation(signals: RiskSignal[]) {
  const urgent = signals.find((signal) => signal.level === 'urgent')
  if (urgent) return urgent.title

  const risk = signals.find((signal) => signal.level === 'risk')
  if (risk) return risk.title

  const watch = signals.find((signal) => signal.level === 'watch')
  if (watch) return watch.title

  return '현재 특이 위험 신호 없음'
}

function confirmationQuestions(input: {
  parentName: string
  signals: RiskSignal[]
}) {
  const questions: string[] = []

  if (input.signals.some((signal) => signal.type === 'no_response')) {
    questions.push(`${input.parentName}와 통화 연결이 되는지 먼저 확인해주세요.`)
    questions.push('통화가 안 되면 가까운 가족 또는 이웃에게 확인 요청이 가능한지 확인하세요.')
  }

  if (input.signals.some((signal) => signal.type === 'medication')) {
    questions.push('오늘 약을 드셨는지, 평소와 다른 약을 드신 것은 없는지 확인하세요.')
  }

  if (input.signals.some((signal) => signal.type === 'meal')) {
    questions.push('오늘 식사를 하셨는지, 물은 충분히 드셨는지 확인하세요.')
  }

  if (input.signals.some((signal) => signal.type === 'condition' || signal.type === 'emergency')) {
    questions.push('어지러움, 낙상, 심한 통증, 호흡 불편, 의식 저하가 있는지 짧게 확인하세요.')
  }

  if (input.signals.some((signal) => signal.type === 'schedule')) {
    questions.push('오늘 병원 일정이나 복약 일정이 있었는지, 완료했는지 확인하세요.')
  }

  if (input.signals.some((signal) => signal.type === 'burden')) {
    questions.push('안부 알림이 부담스럽지는 않은지, 확인 시간을 바꾸는 것이 좋을지 물어보세요.')
  }

  if (questions.length === 0) {
    questions.push('오늘 컨디션이 평소와 같은지 가볍게 확인하세요.')
    questions.push('식사와 약 복용이 평소대로 되었는지 확인하세요.')
  }

  return unique(questions)
}

function buildCallScript(input: {
  parentName: string
  signals: RiskSignal[]
  riskLevel: RiskLevel
}) {
  const intro =
    input.riskLevel === 'urgent'
      ? `${input.parentName}, 지금 바로 확인이 필요해서 전화했어요. 괜찮으세요?`
      : `${input.parentName}, 오늘 안부 확인하려고 전화했어요. 괜찮으세요?`

  const lines = [
    intro,
    '오늘 식사는 하셨어요?',
    '약 드실 시간이 있었다면 약은 드셨어요?',
    '몸이 평소와 다르게 불편한 곳은 없으세요?'
  ]

  if (input.signals.some((signal) => signal.type === 'no_response')) {
    lines.push('안부 버튼이 확인되지 않아서 걱정돼서 연락드렸어요.')
  }

  if (input.signals.some((signal) => signal.type === 'emergency' || signal.type === 'condition')) {
    lines.push('어지럽거나 넘어지셨거나 통증이 심하면 바로 알려주세요.')
  }

  lines.push('확인되면 제가 안심 처리해둘게요.')

  return lines.join('\n')
}

function buildGuardianMessage(input: {
  parentName: string
  riskLevel: RiskLevel
  primary: string
  questions: string[]
}) {
  const levelText =
    input.riskLevel === 'urgent'
      ? '즉시 확인 필요'
      : input.riskLevel === 'risk'
        ? '확인 필요'
        : input.riskLevel === 'watch'
          ? '주의'
          : '정상'

  return [
    `[안부웍스] ${input.parentName} 안심 확인: ${levelText}`,
    `주요 사유: ${input.primary}`,
    '',
    '확인 질문:',
    ...input.questions.slice(0, 3).map((item, index) => `${index + 1}. ${item}`),
    '',
    '※ 의료 진단이 아니라 보호자 확인을 돕는 참고 안내입니다.'
  ].join('\n')
}

function buildCarePartnerBrief(input: {
  parentName: string
  primary: string
  questions: string[]
  riskLevel: RiskLevel
}) {
  return [
    `대상: ${input.parentName}`,
    `확인 필요 사유: ${input.primary}`,
    `우선 확인 수준: ${input.riskLevel === 'urgent' ? '긴급 확인' : input.riskLevel === 'risk' ? '주의 확인' : '일반 확인'}`,
    '',
    '현장 확인 시 참고:',
    ...input.questions.slice(0, 4).map((item, index) => `${index + 1}. ${item}`),
    '',
    '주의: 의료적 판단 표현은 피하고, 관찰 사실과 보호자 전달사항 중심으로 기록하세요.'
  ].join('\n')
}

function nextActions(input: {
  riskLevel: RiskLevel
  activeCareRequests: number
  pendingReports: number
}) {
  const priority = priorityFromLevel(input.riskLevel)

  const actions: RiskAction[] = [
    {
      actionType: 'record_call_parent',
      label: '부모님 전화 확인',
      description: '보호자가 부모님께 전화해 식사, 복약, 몸 상태를 확인합니다.',
      priority,
      buttonLabel: '전화 확인 기록'
    },
    {
      actionType: 'send_guardian_notice',
      label: '보호자 확인 요청',
      description: '보호자에게 지금 확인해야 할 질문과 행동 가이드를 전달합니다.',
      priority,
      buttonLabel: '보호자 확인 기록'
    }
  ]

  if (input.riskLevel === 'urgent' || input.riskLevel === 'risk') {
    actions.push({
      actionType: 'request_family_check',
      label: '가족 2차 확인',
      description: '통화가 안 되면 가까운 가족 또는 지인에게 확인 요청을 전환합니다.',
      priority: 'urgent',
      buttonLabel: '가족 확인 기록'
    })

    actions.push({
      actionType: 'request_partner_check',
      label: '케어파트너 현장확인',
      description: '현장 확인이 필요하면 케어파트너 방문확인 요청으로 전환합니다.',
      priority: 'urgent',
      buttonLabel: '케어파트너 요청'
    })
  }

  if (input.pendingReports > 0) {
    actions.push({
      actionType: 'review_report',
      label: '리포트 검수',
      description: '보호자 공개 전 리포트 품질과 개인정보 표현을 확인합니다.',
      priority: 'important',
      buttonLabel: '검수 기록'
    })
  }

  actions.push({
    actionType: 'mark_resolved',
    label: '확인 완료',
    description: '부모님 상태를 확인했다면 위험 신호를 완료 처리합니다.',
    priority: 'normal',
    buttonLabel: '확인 완료'
  })

  if (input.riskLevel === 'watch' || input.riskLevel === 'normal') {
    actions.push({
      actionType: 'adjust_burden',
      label: '알림 부담 조정',
      description: '부모님이 부담을 느끼지 않도록 안부 확인 시간을 조정합니다.',
      priority: 'normal',
      buttonLabel: '부담 조정 기록'
    })
  }

  return actions
}

export function buildRiskActionDashboard(input: {
  families: Array<Record<string, unknown>>
  checkins: Array<Record<string, unknown>>
  consents: Array<Record<string, unknown>>
  consentActions: Array<Record<string, unknown>>
  safetyActions: Array<Record<string, unknown>>
  escalationEvents: Array<Record<string, unknown>>
  careRequests: Array<Record<string, unknown>>
  reports: Array<Record<string, unknown>>
  schedules: Array<Record<string, unknown>>
}) {
  const checkinsByFamily = groupByFamily(input.checkins)
  const consentsByFamily = groupByFamily(input.consents)
  const consentActionsByFamily = groupByFamily(input.consentActions)
  const safetyActionsByFamily = groupByFamily(input.safetyActions)
  const escalationEventsByFamily = groupByFamily(input.escalationEvents)
  const careRequestsByFamily = groupByFamily(input.careRequests)
  const reportsByFamily = groupByFamily(input.reports)
  const schedulesByFamily = groupByFamily(input.schedules)

  const guides: RiskActionGuide[] = input.families.map((family) => {
    const familyCode = text(family.family_code)
    const parentName = text(family.parent_name) || '부모님'
    const guardianName = text(family.guardian_name) || '보호자'
    const guardianPhone = text(family.guardian_phone)

    const checkins = checkinsByFamily.get(familyCode) || []
    const consents = consentsByFamily.get(familyCode) || []
    const consentActions = consentActionsByFamily.get(familyCode) || []
    const safetyActions = safetyActionsByFamily.get(familyCode) || []
    const escalationEvents = escalationEventsByFamily.get(familyCode) || []
    const careRequests = careRequestsByFamily.get(familyCode) || []
    const reports = reportsByFamily.get(familyCode) || []
    const schedules = schedulesByFamily.get(familyCode) || []

    const lastCheckinMs = latestDate(checkins, ['occurred_at', 'created_at'])
    const noResponseHours = hoursSince(lastCheckinMs)

    const signals = buildSignals({
      noResponseHours,
      checkins,
      consents,
      consentActions,
      escalationEvents,
      careRequests,
      reports,
      schedules
    })

    const riskScore = scoreFromSignals(signals)
    const riskLevel = levelFromScore(riskScore)
    const primary = primarySituation(signals)
    const questions = confirmationQuestions({ parentName, signals })
    const activeCare = activeCareRequests(careRequests).length
    const pending = pendingReports(reports).length

    return {
      familyCode,
      parentName,
      guardianName,
      guardianPhone,
      riskLevel,
      riskScore,
      primarySituation: primary,
      summary:
        riskLevel === 'urgent'
          ? `${parentName}의 상태는 즉시 확인이 필요합니다. 보호자 전화 확인 또는 가족 2차 확인을 우선 권장합니다.`
          : riskLevel === 'risk'
            ? `${parentName}의 상태는 확인이 필요합니다. 보호자가 식사, 복약, 몸 상태를 짧게 확인하세요.`
            : riskLevel === 'watch'
              ? `${parentName}의 상태는 주의 관찰 단계입니다. 안부 응답과 일정 확인을 한 번 더 확인하세요.`
              : `${parentName}의 상태는 현재 안정적으로 보입니다. 정기 안부 루틴을 유지하세요.`,
      signals,
      confirmationQuestions: questions,
      callScript: buildCallScript({ parentName, signals, riskLevel }),
      guardianMessage: buildGuardianMessage({
        parentName,
        riskLevel,
        primary,
        questions
      }),
      carePartnerBrief: buildCarePartnerBrief({
        parentName,
        primary,
        questions,
        riskLevel
      }),
      nextActions: nextActions({
        riskLevel,
        activeCareRequests: activeCare,
        pendingReports: pending
      }),
      safetyNote: '이 안내는 의료 진단이 아니라 보호자가 부모님 상태를 확인하도록 돕는 참고 가이드입니다. 응급상황이 의심되면 119 또는 직접 확인이 우선입니다.',
      raw: {
        family,
        checkins,
        consents,
        consentActions,
        safetyActions,
        escalationEvents,
        careRequests,
        reports,
        schedules
      }
    }
  })

  guides.sort((a, b) => b.riskScore - a.riskScore)

  const urgent = guides.filter((guide) => guide.riskLevel === 'urgent').length
  const risk = guides.filter((guide) => guide.riskLevel === 'risk').length
  const watch = guides.filter((guide) => guide.riskLevel === 'watch').length

  const systemInsights: string[] = []

  if (urgent > 0) systemInsights.push(`${urgent}가족은 즉시 확인이 필요한 상태입니다.`)
  if (risk > 0) systemInsights.push(`${risk}가족은 보호자 확인이 필요한 상태입니다.`)
  if (watch > 0) systemInsights.push(`${watch}가족은 주의 관찰 단계입니다.`)
  if (systemInsights.length === 0) systemInsights.push('현재 전체 가족은 안정적인 확인 흐름을 보입니다.')

  return {
    generatedAt: new Date().toISOString(),
    cards: [
      {
        key: 'urgent',
        label: '즉시 확인',
        value: urgent,
        help: '12시간 이상 무응답, 도움 요청 등'
      },
      {
        key: 'risk',
        label: '확인 필요',
        value: risk,
        help: '복약·몸상태·무응답 확인 필요'
      },
      {
        key: 'watch',
        label: '주의 관찰',
        value: watch,
        help: '부담도·일정·안부 지연'
      },
      {
        key: 'total',
        label: '가이드 생성',
        value: guides.length,
        help: '가족별 행동 가이드'
      }
    ],
    guides,
    systemInsights,
    rawCounts: {
      families: input.families.length,
      checkins: input.checkins.length,
      consents: input.consents.length,
      consentActions: input.consentActions.length,
      safetyActions: input.safetyActions.length,
      escalationEvents: input.escalationEvents.length,
      careRequests: input.careRequests.length,
      reports: input.reports.length,
      schedules: input.schedules.length
    }
  }
}
