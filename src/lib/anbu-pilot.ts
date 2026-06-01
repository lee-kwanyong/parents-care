export type PilotStatus = 'active' | 'completed' | 'paused' | 'virtual'
export type PilotRisk = 'good' | 'watch' | 'risk'

export type PilotFamily = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  cohortName: string
  participantStatus: PilotStatus
  targetDays: number
  startDate: string
  endDate: string
  elapsedDays: number
  progressRate: number
  responseRate: number
  checkinDays: number
  checkinCount: number
  noResponseCount: number
  closureCount: number
  closureRate: number
  riskActionCount: number
  careRequestCount: number
  reportCount: number
  approvedReportCount: number
  feedbackCount: number
  averageRating: number | null
  burdenRating: number | null
  trustRating: number | null
  burdenScore: number
  risk: PilotRisk
  insights: string[]
  nextActions: string[]
  reportText: string
  raw: {
    participant: Record<string, unknown> | null
    family: Record<string, unknown> | null
    checkins: Array<Record<string, unknown>>
    notifications: Array<Record<string, unknown>>
    safetyActions: Array<Record<string, unknown>>
    escalationEvents: Array<Record<string, unknown>>
    riskActionEvents: Array<Record<string, unknown>>
    careRequests: Array<Record<string, unknown>>
    reports: Array<Record<string, unknown>>
    feedback: Array<Record<string, unknown>>
    pilotEvents: Array<Record<string, unknown>>
  }
}

export type PilotDashboard = {
  generatedAt: string
  cards: Array<{
    key: string
    label: string
    value: string | number
    help: string
  }>
  families: PilotFamily[]
  systemInsights: string[]
  reportText: string
  rawCounts: Record<string, number>
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown, fallback = 0) {
  const valueNumber = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(valueNumber) ? valueNumber : fallback
}

function dateMs(value: unknown) {
  const raw = text(value)
  if (!raw) return 0

  const ms = new Date(raw).getTime()
  return Number.isFinite(ms) ? ms : 0
}

function dateOnly(value: unknown) {
  const raw = text(value)
  if (!raw) return ''

  const ms = dateMs(raw)
  if (!ms) return raw.slice(0, 10)

  return new Date(ms).toISOString().slice(0, 10)
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(date: string, days: number) {
  const base = dateMs(date) || Date.now()
  return new Date(base + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string) {
  const startMs = dateMs(start)
  const endMs = dateMs(end)

  if (!startMs || !endMs) return 0

  return Math.max(1, Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000)))
}

function elapsedDays(startDate: string, endDate: string) {
  const startMs = dateMs(startDate)
  const nowMs = Math.min(Date.now(), dateMs(endDate) || Date.now())

  if (!startMs) return 1

  return Math.max(1, Math.ceil((nowMs - startMs) / (24 * 60 * 60 * 1000)))
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

function average(rows: Array<Record<string, unknown>>, key: string) {
  const values = rows
    .map((row) => numberValue(row[key], NaN))
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) return null

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

function uniqueDays(rows: Array<Record<string, unknown>>, keys: string[]) {
  const days = new Set<string>()

  for (const row of rows) {
    for (const key of keys) {
      const day = dateOnly(row[key])
      if (day) days.add(day)
    }
  }

  return days.size
}

function filterByPeriod(rows: Array<Record<string, unknown>>, startDate: string, endDate: string, keys: string[]) {
  const startMs = dateMs(startDate)
  const endMs = dateMs(addDays(endDate, 1))

  return rows.filter((row) => {
    for (const key of keys) {
      const ms = dateMs(row[key])
      if (ms && ms >= startMs && ms < endMs) return true
    }

    return false
  })
}

function countRows(rows: Array<Record<string, unknown>>, predicate: (row: Record<string, unknown>) => boolean) {
  return rows.filter(predicate).length
}

function buildBurdenScore(input: {
  notifications: Array<Record<string, unknown>>
  consentActions: Array<Record<string, unknown>>
  escalationEvents: Array<Record<string, unknown>>
}) {
  const restOrLater = input.consentActions.filter((row) =>
    ['rest_today', 'reply_later'].includes(text(row.action_type))
  ).length

  const helpOrCall = input.consentActions.filter((row) =>
    ['help_needed', 'call_guardian'].includes(text(row.action_type))
  ).length

  let score = 10
  score += input.notifications.length * 4
  score += input.escalationEvents.length * 7
  score += restOrLater * 14
  score += helpOrCall * 18

  return Math.max(0, Math.min(100, score))
}

function riskFromMetrics(input: {
  responseRate: number
  closureRate: number
  noResponseCount: number
  burdenScore: number
  averageRating: number | null
}) {
  if (input.noResponseCount >= 3 || input.responseRate < 40 || input.burdenScore >= 75) return 'risk'
  if (input.responseRate < 70 || input.closureRate < 50 || input.noResponseCount > 0 || input.burdenScore >= 45) return 'watch'
  if (input.averageRating !== null && input.averageRating < 3) return 'watch'
  return 'good'
}

function insightList(input: {
  responseRate: number
  closureRate: number
  noResponseCount: number
  burdenScore: number
  feedbackCount: number
  averageRating: number | null
  careRequestCount: number
  reportCount: number
}) {
  const insights: string[] = []

  if (input.responseRate >= 80) {
    insights.push('안부 응답률이 높아 실증 참여 루틴이 안정적입니다.')
  } else if (input.responseRate >= 50) {
    insights.push('안부 응답률이 보통 수준입니다. 부모님이 편한 확인 시간을 찾아야 합니다.')
  } else {
    insights.push('안부 응답률이 낮습니다. 알림 시간, 부모님 부담도, 사용 난이도를 점검해야 합니다.')
  }

  if (input.noResponseCount > 0) {
    insights.push(`실증 기간 중 무응답 신호가 ${input.noResponseCount}건 발생했습니다.`)
  }

  if (input.closureRate >= 70) {
    insights.push('무응답 또는 위험 신호 이후 확인 완료 흐름이 비교적 잘 닫히고 있습니다.')
  } else {
    insights.push('알림 이후 확인 완료 기록이 부족합니다. 보호자 조치 기록을 강화해야 합니다.')
  }

  if (input.burdenScore >= 70) {
    insights.push('부모님 부담도가 높습니다. 확인 빈도와 메시지 강도를 낮추는 실험이 필요합니다.')
  } else if (input.burdenScore >= 40) {
    insights.push('부모님 부담도가 보통 수준입니다. “오늘은 쉬고 싶어요” 선택 비율을 관찰하세요.')
  }

  if (input.feedbackCount === 0) {
    insights.push('보호자·부모님 피드백이 아직 없습니다. 실증 신뢰도를 위해 피드백 수집이 필요합니다.')
  } else if (input.averageRating !== null) {
    insights.push(`평균 만족도는 ${input.averageRating}점입니다.`)
  }

  if (input.careRequestCount > 0 || input.reportCount > 0) {
    insights.push('케어파트너 실행 데이터가 쌓이고 있어 오프라인 확인 모델 검증에 활용할 수 있습니다.')
  }

  return Array.from(new Set(insights))
}

function nextActions(input: {
  responseRate: number
  closureRate: number
  noResponseCount: number
  burdenScore: number
  feedbackCount: number
  careRequestCount: number
  reportCount: number
}) {
  const actions: string[] = []

  if (input.responseRate < 70) {
    actions.push('부모님이 가장 편하게 응답하는 시간대를 찾아 안부 요청 시간을 조정하세요.')
  }

  if (input.noResponseCount > 0) {
    actions.push('무응답 발생 시 보호자 확인 완료 버튼을 반드시 남기도록 안내하세요.')
  }

  if (input.closureRate < 70) {
    actions.push('안심루프·Risk-to-Action에서 추천한 행동의 결과를 기록하도록 운영 가이드를 강화하세요.')
  }

  if (input.burdenScore >= 45) {
    actions.push('부모님 안심동의 카드에서 공유 항목과 알림 빈도를 다시 확인하세요.')
  }

  if (input.feedbackCount === 0) {
    actions.push('보호자 피드백 1건 이상을 수집해 실증 근거를 확보하세요.')
  }

  if (input.careRequestCount === 0 && input.noResponseCount > 0) {
    actions.push('반복 무응답 가족은 케어파트너 현장확인 실증 대상으로 분류하세요.')
  }

  if (actions.length === 0) {
    actions.push('현재 실증 흐름은 안정적입니다. 동일 루틴으로 7일 이상 데이터를 축적하세요.')
  }

  return Array.from(new Set(actions))
}

function familyDisplayName(family: Record<string, unknown>, participant: Record<string, unknown> | null) {
  return {
    familyCode: text(participant?.family_code) || text(family.family_code),
    parentName: text(participant?.parent_name) || text(family.parent_name) || '부모님',
    guardianName: text(participant?.guardian_name) || text(family.guardian_name) || '보호자',
    guardianPhone: text(participant?.guardian_phone) || text(family.guardian_phone)
  }
}

function participantStatus(value: string): PilotStatus {
  if (value === 'completed') return 'completed'
  if (value === 'paused') return 'paused'
  if (value === 'active') return 'active'
  return 'virtual'
}

export function buildPilotDashboard(input: {
  participants: Array<Record<string, unknown>>
  families: Array<Record<string, unknown>>
  checkins: Array<Record<string, unknown>>
  notifications: Array<Record<string, unknown>>
  consentActions: Array<Record<string, unknown>>
  safetyActions: Array<Record<string, unknown>>
  escalationEvents: Array<Record<string, unknown>>
  riskActionEvents: Array<Record<string, unknown>>
  careRequests: Array<Record<string, unknown>>
  reports: Array<Record<string, unknown>>
  feedback: Array<Record<string, unknown>>
  pilotEvents: Array<Record<string, unknown>>
}): PilotDashboard {
  const familiesByCode = new Map<string, Record<string, unknown>>()

  for (const family of input.families) {
    const code = text(family.family_code)
    if (code) familiesByCode.set(code, family)
  }

  const participantCodes = new Set(input.participants.map((row) => text(row.family_code)).filter(Boolean))
  const virtualParticipants = input.families
    .filter((family) => !participantCodes.has(text(family.family_code)))
    .map((family) => ({
      id: `virtual:${text(family.family_code)}`,
      family_code: text(family.family_code),
      parent_name: text(family.parent_name),
      guardian_name: text(family.guardian_name),
      guardian_phone: text(family.guardian_phone),
      participant_status: 'virtual',
      target_days: 14,
      start_date: dateOnly(family.created_at) || todayIsoDate(),
      end_date: addDays(dateOnly(family.created_at) || todayIsoDate(), 14),
      cohort_name: '자동 감지 가족'
    }))

  const participantRows = [...input.participants, ...virtualParticipants]

  const checkinsByFamily = groupByFamily(input.checkins)
  const notificationsByFamily = groupByFamily(input.notifications)
  const consentActionsByFamily = groupByFamily(input.consentActions)
  const safetyActionsByFamily = groupByFamily(input.safetyActions)
  const escalationEventsByFamily = groupByFamily(input.escalationEvents)
  const riskActionEventsByFamily = groupByFamily(input.riskActionEvents)
  const careRequestsByFamily = groupByFamily(input.careRequests)
  const reportsByFamily = groupByFamily(input.reports)
  const feedbackByFamily = groupByFamily(input.feedback)
  const pilotEventsByFamily = groupByFamily(input.pilotEvents)

  const families = participantRows.map((participant) => {
    const code = text(participant.family_code)
    const family = familiesByCode.get(code) || {}

    const names = familyDisplayName(family, participant)

    const targetDays = Math.max(7, numberValue(participant.target_days, 14))
    const startDate = dateOnly(participant.start_date) || todayIsoDate()
    const endDate = dateOnly(participant.end_date) || addDays(startDate, targetDays)

    const totalDays = daysBetween(startDate, endDate)
    const elapsed = Math.min(totalDays, elapsedDays(startDate, endDate))
    const progressRate = Math.max(0, Math.min(100, Math.round((elapsed / totalDays) * 100)))

    const checkins = filterByPeriod(checkinsByFamily.get(code) || [], startDate, endDate, ['occurred_at', 'created_at'])
    const notifications = filterByPeriod(notificationsByFamily.get(code) || [], startDate, endDate, ['created_at', 'sent_at'])
    const consentActions = filterByPeriod(consentActionsByFamily.get(code) || [], startDate, endDate, ['created_at'])
    const safetyActions = filterByPeriod(safetyActionsByFamily.get(code) || [], startDate, endDate, ['created_at'])
    const escalationEvents = filterByPeriod(escalationEventsByFamily.get(code) || [], startDate, endDate, ['created_at'])
    const riskActionEvents = filterByPeriod(riskActionEventsByFamily.get(code) || [], startDate, endDate, ['created_at'])
    const careRequests = filterByPeriod(careRequestsByFamily.get(code) || [], startDate, endDate, ['created_at', 'updated_at'])
    const reports = filterByPeriod(reportsByFamily.get(code) || [], startDate, endDate, ['created_at', 'updated_at'])
    const feedback = filterByPeriod(feedbackByFamily.get(code) || [], startDate, endDate, ['created_at'])
    const pilotEvents = filterByPeriod(pilotEventsByFamily.get(code) || [], startDate, endDate, ['created_at'])

    const checkinDays = uniqueDays(checkins, ['occurred_at', 'created_at'])
    const responseRate = Math.max(0, Math.min(100, Math.round((checkinDays / elapsed) * 100)))

    const noResponseCount = countRows(notifications, (row) =>
      text(row.reason).includes('no-response') ||
      text(row.title).includes('응답 없음') ||
      text(row.body).includes('응답')
    ) + countRows(escalationEvents, (row) =>
      ['stage1', 'stage2', 'stage3', 'help'].includes(text(row.stage))
    )

    const closureCount =
      countRows(safetyActions, (row) => text(row.action_type) === 'mark_complete') +
      countRows(escalationEvents, (row) => text(row.action_type) === 'mark_resolved') +
      countRows(riskActionEvents, (row) => text(row.action_type) === 'mark_resolved') +
      countRows(pilotEvents, (row) => text(row.event_type) === 'resolved')

    const closureRate =
      noResponseCount === 0
        ? closureCount > 0 ? 100 : 80
        : Math.max(0, Math.min(100, Math.round((closureCount / noResponseCount) * 100)))

    const careRequestCount = careRequests.length
    const reportCount = reports.length
    const approvedReportCount = countRows(reports, (row) => text(row.report_status) === 'approved')
    const averageRating = average(feedback, 'rating')
    const burdenRating = average(feedback, 'burden_rating')
    const trustRating = average(feedback, 'trust_rating')

    const burdenScore = buildBurdenScore({
      notifications,
      consentActions,
      escalationEvents
    })

    const risk = riskFromMetrics({
      responseRate,
      closureRate,
      noResponseCount,
      burdenScore,
      averageRating
    })

    const insights = insightList({
      responseRate,
      closureRate,
      noResponseCount,
      burdenScore,
      feedbackCount: feedback.length,
      averageRating,
      careRequestCount,
      reportCount
    })

    const actions = nextActions({
      responseRate,
      closureRate,
      noResponseCount,
      burdenScore,
      feedbackCount: feedback.length,
      careRequestCount,
      reportCount
    })

    const reportText = [
      `# ${names.parentName} 실증 요약`,
      '',
      `- 가족코드: ${names.familyCode}`,
      `- 보호자: ${names.guardianName}`,
      `- 실증 기간: ${startDate} ~ ${endDate}`,
      `- 진행률: ${progressRate}%`,
      `- 안부 응답률: ${responseRate}%`,
      `- 무응답/위험 신호: ${noResponseCount}건`,
      `- 확인 완료율: ${closureRate}%`,
      `- Risk-to-Action 사용: ${riskActionEvents.length}건`,
      `- 케어 요청: ${careRequestCount}건`,
      `- 리포트: ${reportCount}건`,
      `- 보호자 피드백: ${feedback.length}건`,
      averageRating !== null ? `- 평균 만족도: ${averageRating}/5` : '- 평균 만족도: 미수집',
      '',
      '## 주요 인사이트',
      ...insights.map((item) => `- ${item}`),
      '',
      '## 다음 조치',
      ...actions.map((item) => `- ${item}`)
    ].join('\n')

    return {
      id: text((participant as Record<string, unknown>).id) || `virtual:${code}`,
      familyCode: names.familyCode,
      parentName: names.parentName,
      guardianName: names.guardianName,
      guardianPhone: names.guardianPhone,
      cohortName: text(participant.cohort_name) || '기본 실증',
      participantStatus: participantStatus(text(participant.participant_status)),
      targetDays,
      startDate,
      endDate,
      elapsedDays: elapsed,
      progressRate,
      responseRate,
      checkinDays,
      checkinCount: checkins.length,
      noResponseCount,
      closureCount,
      closureRate,
      riskActionCount: riskActionEvents.length,
      careRequestCount,
      reportCount,
      approvedReportCount,
      feedbackCount: feedback.length,
      averageRating,
      burdenRating,
      trustRating,
      burdenScore,
      risk,
      insights,
      nextActions: actions,
      reportText,
      raw: {
        participant,
        family,
        checkins,
        notifications,
        safetyActions,
        escalationEvents,
        riskActionEvents,
        careRequests,
        reports,
        feedback,
        pilotEvents
      }
    } satisfies PilotFamily
  })

  families.sort((a, b) => {
    const riskWeight = { risk: 3, watch: 2, good: 1 }
    return (riskWeight[b.risk] || 0) - (riskWeight[a.risk] || 0)
  })

  const active = families.filter((family) => ['active', 'virtual'].includes(family.participantStatus)).length
  const completed = families.filter((family) => family.participantStatus === 'completed').length
  const riskFamilies = families.filter((family) => family.risk === 'risk').length
  const averageResponseRate =
    families.length === 0
      ? 0
      : Math.round(families.reduce((sum, family) => sum + family.responseRate, 0) / families.length)

  const averageClosureRate =
    families.length === 0
      ? 0
      : Math.round(families.reduce((sum, family) => sum + family.closureRate, 0) / families.length)

  const totalFeedback = families.reduce((sum, family) => sum + family.feedbackCount, 0)
  const totalCareRequests = families.reduce((sum, family) => sum + family.careRequestCount, 0)
  const totalRiskActions = families.reduce((sum, family) => sum + family.riskActionCount, 0)

  const systemInsights: string[] = []

  systemInsights.push(`현재 실증 대상은 ${families.length}가족이며, 활성 실증은 ${active}가족입니다.`)
  systemInsights.push(`평균 안부 응답률은 ${averageResponseRate}%입니다.`)
  systemInsights.push(`평균 확인 완료율은 ${averageClosureRate}%입니다.`)

  if (riskFamilies > 0) systemInsights.push(`${riskFamilies}가족은 실증 중점관리 대상으로 분류됩니다.`)
  if (totalFeedback === 0) systemInsights.push('아직 피드백이 부족합니다. 기관 제출용 근거 확보를 위해 보호자 피드백 수집이 필요합니다.')
  if (totalCareRequests > 0) systemInsights.push(`케어파트너 실행 데이터가 ${totalCareRequests}건 쌓였습니다.`)
  if (totalRiskActions > 0) systemInsights.push(`Risk-to-Action 행동 기록이 ${totalRiskActions}건 쌓였습니다.`)

  const reportText = [
    '# 안부웍스 실증 운영 요약',
    '',
    `- 생성일: ${new Date().toLocaleString('ko-KR')}`,
    `- 참여 가족 수: ${families.length}`,
    `- 활성 실증 가족 수: ${active}`,
    `- 완료 가족 수: ${completed}`,
    `- 평균 안부 응답률: ${averageResponseRate}%`,
    `- 평균 확인 완료율: ${averageClosureRate}%`,
    `- 피드백 수집 건수: ${totalFeedback}건`,
    `- 케어 요청 건수: ${totalCareRequests}건`,
    `- Risk-to-Action 사용 건수: ${totalRiskActions}건`,
    '',
    '## 시스템 인사이트',
    ...systemInsights.map((item) => `- ${item}`),
    '',
    '## 기관 제출용 핵심 문장',
    '- 안부웍스는 단순 안부 확인이 아니라, 응답률·무응답 처리율·확인 완료율·부모님 부담도·케어 실행률을 실증 데이터로 추적합니다.',
    '- 실증 결과는 가족별 운영 리포트와 기관 제출용 요약 리포트로 축적됩니다.'
  ].join('\n')

  return {
    generatedAt: new Date().toISOString(),
    cards: [
      {
        key: 'families',
        label: '실증 가족',
        value: families.length,
        help: '등록 또는 자동 감지 가족'
      },
      {
        key: 'response',
        label: '평균 응답률',
        value: `${averageResponseRate}%`,
        help: '실증 기간 내 안부 응답일 기준'
      },
      {
        key: 'closure',
        label: '확인 완료율',
        value: `${averageClosureRate}%`,
        help: '무응답/위험 신호 이후 완료 처리'
      },
      {
        key: 'feedback',
        label: '피드백',
        value: totalFeedback,
        help: '보호자·부모님 만족도 기록'
      }
    ],
    families,
    systemInsights,
    reportText,
    rawCounts: {
      participants: input.participants.length,
      families: input.families.length,
      checkins: input.checkins.length,
      notifications: input.notifications.length,
      consentActions: input.consentActions.length,
      safetyActions: input.safetyActions.length,
      escalationEvents: input.escalationEvents.length,
      riskActionEvents: input.riskActionEvents.length,
      careRequests: input.careRequests.length,
      reports: input.reports.length,
      feedback: input.feedback.length,
      pilotEvents: input.pilotEvents.length
    }
  }
}
