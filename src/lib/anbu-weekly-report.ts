export type WeeklyCareCheckin = {
  id?: string
  family_code?: string | null
  elder_name?: string | null
  check_type?: string | null
  care_label?: string | null
  status?: string | null
  memo?: string | null
  occurred_at?: string | null
  created_at?: string | null
}

export type WeeklyNotification = {
  id?: string
  family_code?: string | null
  reason?: string | null
  status?: string | null
  provider?: string | null
  created_at?: string | null
  sent_at?: string | null
}

export type WeeklySchedule = {
  id?: string
  family_code?: string | null
  schedule_type?: string | null
  title?: string | null
  schedule_date?: string | null
  schedule_time?: string | null
  memo?: string | null
}

export type WeeklyReportResult = {
  familyCode: string
  parentName: string
  guardianName: string
  periodLabel: string
  state: '정상' | '주의' | '확인 필요'
  score: number
  summary: string
  stats: Array<{
    label: string
    value: string
    help: string
  }>
  dayRows: Array<{
    date: string
    meal: number
    medication: number
    condition: number
    risk: number
  }>
  signals: string[]
  nextActions: string[]
  raw: {
    checkins: WeeklyCareCheckin[]
    notifications: WeeklyNotification[]
    schedules: WeeklySchedule[]
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

function kstDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function recentSevenDays() {
  const base = Date.now() + 9 * 60 * 60 * 1000

  return Array.from({ length: 7 }, (_, index) => {
    const offset = 6 - index
    return new Date(base - offset * DAY_MS).toISOString().slice(0, 10)
  })
}

function countBy<T>(items: T[], predicate: (item: T) => boolean) {
  return items.filter(predicate).length
}

function unique(items: string[]) {
  return Array.from(new Set(items)).filter(Boolean)
}

function getTime(item: WeeklyCareCheckin) {
  const raw = item.occurred_at || item.created_at || ''
  const time = new Date(raw).getTime()
  return Number.isFinite(time) ? time : 0
}

export function buildWeeklyReport(input: {
  familyCode: string
  parentName?: string
  guardianName?: string
  checkins: WeeklyCareCheckin[]
  notifications: WeeklyNotification[]
  schedules: WeeklySchedule[]
}): WeeklyReportResult {
  const days = recentSevenDays()
  const sinceDate = days[0]
  const untilDate = days[days.length - 1]

  const checkins = input.checkins
    .filter((item) => {
      const raw = item.occurred_at || item.created_at
      if (!raw) return false
      const date = kstDate(raw)
      return date >= sinceDate && date <= untilDate
    })
    .sort((a, b) => getTime(b) - getTime(a))

  const notifications = input.notifications.filter((item) => {
    const raw = item.created_at || item.sent_at
    if (!raw) return false
    const date = kstDate(raw)
    return date >= sinceDate && date <= untilDate
  })

  const schedules = input.schedules.filter((item) => {
    const date = item.schedule_date || ''
    return date >= sinceDate && date <= untilDate
  })

  const mealDone = countBy(checkins, (item) => item.check_type === 'meal' && item.status === 'done')
  const mealMissed = countBy(checkins, (item) => item.check_type === 'meal' && item.status === 'not_done')
  const medicationDone = countBy(checkins, (item) => item.check_type === 'medication' && item.status === 'done')
  const medicationMissed = countBy(checkins, (item) => item.check_type === 'medication' && item.status === 'not_done')
  const conditionOk = countBy(checkins, (item) => item.check_type === 'condition' && item.status === 'done')
  const conditionRisk = countBy(checkins, (item) => item.check_type === 'condition' && item.status !== 'done')
  const helpRequests = countBy(checkins, (item) => item.check_type === 'emergency' || item.status === 'needs_help')
  const noResponseAlerts = countBy(notifications, (item) => item.reason === 'no-response')
  const sentSms = countBy(notifications, (item) => item.status === 'sent' && item.provider === 'solapi-sms')

  const respondedDays = unique(checkins.map((item) => kstDate(item.occurred_at || item.created_at || new Date())))
  const responseRate = Math.round((respondedDays.length / 7) * 100)

  let score = 100

  score -= mealMissed * 8
  score -= medicationMissed * 10
  score -= conditionRisk * 8
  score -= helpRequests * 18
  score -= noResponseAlerts * 12
  score -= Math.max(0, 7 - respondedDays.length) * 5

  score = Math.max(0, Math.min(100, score))

  const state =
    helpRequests > 0 || score < 60
      ? '확인 필요'
      : score < 80 || mealMissed > 0 || medicationMissed > 0 || noResponseAlerts > 0
        ? '주의'
        : '정상'

  const signals: string[] = []

  if (respondedDays.length === 0) {
    signals.push('최근 7일 안부 응답이 없습니다.')
  } else {
    signals.push(`최근 7일 중 ${respondedDays.length}일 안부 응답이 있었습니다.`)
  }

  if (mealMissed > 0) signals.push(`식사 미확인 또는 식사 못함 기록이 ${mealMissed}회 있습니다.`)
  if (medicationMissed > 0) signals.push(`복약 미확인 기록이 ${medicationMissed}회 있습니다.`)
  if (conditionRisk > 0) signals.push(`몸 상태 또는 활동 확인 필요 기록이 ${conditionRisk}회 있습니다.`)
  if (helpRequests > 0) signals.push(`도움 요청 또는 긴급 확인 신호가 ${helpRequests}회 있습니다.`)
  if (noResponseAlerts > 0) signals.push(`응답 없음 보호자 알림이 ${noResponseAlerts}회 발생했습니다.`)
  if (schedules.length > 0) signals.push(`이번 주 등록된 복약·병원 일정이 ${schedules.length}건 있습니다.`)
  if (sentSms > 0) signals.push(`보호자 SMS 알림이 ${sentSms}건 발송되었습니다.`)

  if (signals.length === 0) {
    signals.push('이번 주 특별한 위험 신호는 없습니다.')
  }

  const nextActions: string[] = []

  if (medicationMissed > 0) {
    nextActions.push('복약 알림 시간을 조정하거나 부모님께 약 보관 위치를 다시 안내하세요.')
  }

  if (mealMissed > 0) {
    nextActions.push('식사를 못 하신 이유를 확인하고 식사 준비 또는 배달 지원을 검토하세요.')
  }

  if (conditionRisk > 0 || helpRequests > 0) {
    nextActions.push('몸 상태, 통증, 낙상 여부를 전화로 확인하세요. 응급 가능성이 있으면 119 또는 의료기관에 연락하세요.')
  }

  if (noResponseAlerts > 0) {
    nextActions.push('응답 없음이 반복되면 보호자 알림 시간을 앞당기거나 운영실 확인 요청을 설정하세요.')
  }

  if (schedules.length > 0) {
    nextActions.push('이번 주 병원·복약 일정 완료 여부를 리포트에서 확인하세요.')
  }

  if (nextActions.length === 0) {
    nextActions.push('현재는 큰 위험 신호가 없습니다. 다음 주에도 식사·복약·몸 상태 응답을 유지하세요.')
  }

  const dayRows = days.map((date) => {
    const dayItems = checkins.filter((item) => kstDate(item.occurred_at || item.created_at || '') === date)

    return {
      date,
      meal: countBy(dayItems, (item) => item.check_type === 'meal' && item.status === 'done'),
      medication: countBy(dayItems, (item) => item.check_type === 'medication' && item.status === 'done'),
      condition: countBy(dayItems, (item) => item.check_type === 'condition' && item.status === 'done'),
      risk: countBy(dayItems, (item) => item.status === 'not_done' || item.status === 'needs_help' || item.check_type === 'emergency')
    }
  })

  const summary =
    state === '정상'
      ? `${input.parentName || '부모님'}의 이번 주 안부는 전반적으로 안정적입니다. 식사·복약·몸 상태 확인을 계속 유지하세요.`
      : state === '주의'
        ? `${input.parentName || '부모님'}의 이번 주 안부에서 일부 확인이 필요한 신호가 있습니다. 보호자 확인을 권장합니다.`
        : `${input.parentName || '부모님'}의 이번 주 안부에서 확인 필요 신호가 있습니다. 보호자 연락 또는 운영실 확인을 권장합니다.`

  return {
    familyCode: input.familyCode,
    parentName: input.parentName || '부모님',
    guardianName: input.guardianName || '보호자',
    periodLabel: `${sinceDate} ~ ${untilDate}`,
    state,
    score,
    summary,
    stats: [
      {
        label: '안부 응답률',
        value: `${responseRate}%`,
        help: `7일 중 ${respondedDays.length}일 응답`
      },
      {
        label: '식사 확인',
        value: `${mealDone}회`,
        help: mealMissed > 0 ? `미확인 ${mealMissed}회` : '미확인 없음'
      },
      {
        label: '복약 확인',
        value: `${medicationDone}회`,
        help: medicationMissed > 0 ? `미확인 ${medicationMissed}회` : '미확인 없음'
      },
      {
        label: '몸 상태 정상',
        value: `${conditionOk}회`,
        help: conditionRisk > 0 ? `확인 필요 ${conditionRisk}회` : '확인 필요 없음'
      },
      {
        label: '응답 없음 알림',
        value: `${noResponseAlerts}회`,
        help: '보호자 SMS 기준'
      },
      {
        label: '이번 주 일정',
        value: `${schedules.length}건`,
        help: '복약·병원 일정'
      }
    ],
    dayRows,
    signals: unique(signals),
    nextActions: unique(nextActions),
    raw: {
      checkins,
      notifications,
      schedules
    }
  }
}
