export type DailyCareType =
  | 'meal'
  | 'medication'
  | 'condition'
  | 'safe_return'
  | 'emergency'

export type DailyCareStatus =
  | 'done'
  | 'not_done'
  | 'needs_help'
  | 'unknown'

export type AnbuSignalState = '정상' | '주의' | '확인 필요'
export type ReassuranceState = '안심' | '확인 필요' | '긴급'

export type DailyCareCheckin = {
  id?: string
  elder_name: string
  check_type: DailyCareType
  care_label: string
  status: DailyCareStatus
  actor_role?: 'parent' | 'family' | 'manager' | 'ops' | 'system'
  source?: string
  memo?: string | null
  occurred_at?: string
  created_at?: string
}

export const parentDailyCareButtons: Array<{
  group: '식사' | '약' | '몸' | '기분' | '활동' | '도움'
  checkType: DailyCareType
  careLabel: string
  status: DailyCareStatus
  title: string
  description: string
  tone: 'safe' | 'caution' | 'danger' | 'neutral'
}> = [
  {
    group: '식사',
    checkType: 'meal',
    careLabel: '오늘 식사',
    status: 'done',
    title: '식사했어요',
    description: '오늘 식사 확인을 보호자에게 보냅니다.',
    tone: 'safe'
  },
  {
    group: '식사',
    checkType: 'meal',
    careLabel: '오늘 식사',
    status: 'not_done',
    title: '아직 못 먹었어요',
    description: '식사 확인 필요로 표시됩니다.',
    tone: 'caution'
  },
  {
    group: '약',
    checkType: 'medication',
    careLabel: '오늘 약',
    status: 'done',
    title: '약 먹었어요',
    description: '복약 확인을 보호자에게 보냅니다.',
    tone: 'safe'
  },
  {
    group: '약',
    checkType: 'medication',
    careLabel: '오늘 약',
    status: 'not_done',
    title: '약을 깜빡했어요',
    description: '복약 확인 필요로 표시됩니다.',
    tone: 'caution'
  },
  {
    group: '몸',
    checkType: 'condition',
    careLabel: '몸 상태',
    status: 'done',
    title: '몸 괜찮아요',
    description: '오늘 몸 상태가 괜찮다고 전달됩니다.',
    tone: 'safe'
  },
  {
    group: '몸',
    checkType: 'condition',
    careLabel: '몸 상태',
    status: 'needs_help',
    title: '몸이 불편해요',
    description: '보호자 확인이 필요하다고 표시됩니다.',
    tone: 'danger'
  },
  {
    group: '기분',
    checkType: 'condition',
    careLabel: '오늘 기분',
    status: 'done',
    title: '기분 괜찮아요',
    description: '오늘 기분 상태를 보호자에게 보냅니다.',
    tone: 'safe'
  },
  {
    group: '기분',
    checkType: 'condition',
    careLabel: '오늘 기분',
    status: 'needs_help',
    title: '외롭거나 힘들어요',
    description: '기분 확인 필요로 표시됩니다.',
    tone: 'caution'
  },
  {
    group: '활동',
    checkType: 'condition',
    careLabel: '외출/활동',
    status: 'done',
    title: '잠깐 움직였어요',
    description: '오늘 활동 확인을 보호자에게 보냅니다.',
    tone: 'safe'
  },
  {
    group: '활동',
    checkType: 'condition',
    careLabel: '외출/활동',
    status: 'not_done',
    title: '오늘은 거의 안 움직였어요',
    description: '활동 감소 신호로 표시됩니다.',
    tone: 'caution'
  },
  {
    group: '도움',
    checkType: 'emergency',
    careLabel: '도움 요청',
    status: 'needs_help',
    title: '도움이 필요해요',
    description: '보호자와 운영실 확인이 필요합니다.',
    tone: 'danger'
  },
  {
    group: '도움',
    checkType: 'safe_return',
    careLabel: '안전 귀가',
    status: 'done',
    title: '집에 잘 도착했어요',
    description: '안전 귀가 확인을 보냅니다.',
    tone: 'neutral'
  }
]

function toTime(value?: string) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word))
}

function unique(items: string[]) {
  return Array.from(new Set(items)).slice(0, 6)
}

export function buildDailyCareSummary(checkins: DailyCareCheckin[]) {
  const now = Date.now()

  const last24h = checkins
    .filter((item) => {
      const time = toTime(item.occurred_at || item.created_at)
      return time > 0 && now - time <= 24 * 60 * 60 * 1000
    })
    .sort((a, b) => toTime(b.occurred_at || b.created_at) - toTime(a.occurred_at || a.created_at))

  const latestByKey = new Map<string, DailyCareCheckin>()

  for (const item of last24h) {
    const key = `${item.check_type}:${item.care_label}`
    const current = latestByKey.get(key)

    if (!current || toTime(item.occurred_at || item.created_at) > toTime(current.occurred_at || current.created_at)) {
      latestByKey.set(key, item)
    }
  }

  const latest = Array.from(latestByKey.values())
  const latestTime = last24h[0] ? toTime(last24h[0].occurred_at || last24h[0].created_at) : 0
  const hoursSinceLatest = latestTime ? (now - latestTime) / (60 * 60 * 1000) : Infinity

  let signalScore = 0
  const signalReasons: string[] = []
  const nextActions: string[] = []

  if (last24h.length === 0) {
    signalScore += 60
    signalReasons.push('최근 24시간 안부 응답이 없습니다.')
    nextActions.push('부모님께 전화하거나 운영실 확인을 요청하세요.')
  } else if (hoursSinceLatest >= 12) {
    signalScore += 40
    signalReasons.push('마지막 안부 응답 후 12시간 이상 지났습니다.')
    nextActions.push('오늘 안부 체크를 다시 요청하세요.')
  } else if (hoursSinceLatest >= 6) {
    signalScore += 20
    signalReasons.push('마지막 안부 응답 후 시간이 꽤 지났습니다.')
  }

  const hasEmergency = latest.some((item) => item.status === 'needs_help' || item.check_type === 'emergency')
  const mealNeedsCheck = latest.some((item) => item.check_type === 'meal' && item.status === 'not_done')
  const medicationNeedsCheck = latest.some((item) => item.check_type === 'medication' && item.status === 'not_done')
  const conditionNeedsCheck = latest.some((item) => item.check_type === 'condition' && item.status === 'needs_help')

  const moodNeedsCheck = latest.some((item) => {
    const text = `${item.care_label} ${item.memo || ''}`
    return item.check_type === 'condition' && includesAny(text, ['기분', '외롭', '힘들', '불안']) && item.status !== 'done'
  })

  const activityNeedsCheck = latest.some((item) => {
    const text = `${item.care_label} ${item.memo || ''}`
    return item.check_type === 'condition' && includesAny(text, ['외출', '활동', '움직']) && item.status !== 'done'
  })

  if (hasEmergency) {
    signalScore += 50
    signalReasons.push('도움 요청 또는 긴급 확인 신호가 있습니다.')
    nextActions.push('부모님께 바로 전화하고, 필요하면 119 또는 운영실에 연결하세요.')
  }

  if (mealNeedsCheck) {
    signalScore += 20
    signalReasons.push('식사 확인이 필요합니다.')
    nextActions.push('식사를 못 하신 이유를 확인하세요.')
  }

  if (medicationNeedsCheck) {
    signalScore += 25
    signalReasons.push('복약 확인이 필요합니다.')
    nextActions.push('복약 여부를 확인하고, 처방 변경은 의료진에게 확인하세요.')
  }

  if (conditionNeedsCheck) {
    signalScore += 25
    signalReasons.push('몸 상태 확인이 필요합니다.')
    nextActions.push('통증, 어지러움, 낙상 여부를 확인하세요.')
  }

  if (moodNeedsCheck) {
    signalScore += 15
    signalReasons.push('기분 저하 또는 외로움 신호가 있습니다.')
    nextActions.push('짧게라도 안부 전화를 해보세요.')
  }

  if (activityNeedsCheck) {
    signalScore += 12
    signalReasons.push('오늘 활동량이 낮게 표시되었습니다.')
  }

  const signalState: AnbuSignalState =
    signalScore >= 60 ? '확인 필요' : signalScore >= 30 ? '주의' : '정상'

  const reassuranceState: ReassuranceState =
    hasEmergency ? '긴급' : signalState === '정상' ? '안심' : '확인 필요'

  if (nextActions.length === 0) {
    nextActions.push('지금은 바로 확인할 일이 없습니다.')
  }

  const guardianSummary =
    signalState === '정상'
      ? '오늘 안부 체크는 정상 범위입니다. 식사, 약, 몸 상태 기록을 계속 확인해 주세요.'
      : signalState === '주의'
        ? '오늘 일부 안부 신호에 주의가 필요합니다. 보호자 확인을 권장합니다.'
        : '오늘 확인이 필요한 안부 신호가 있습니다. 부모님께 연락하거나 운영실 확인을 요청하세요.'

  return {
    reassuranceState,
    signalState,
    signalScore: Math.min(signalScore, 100),
    signalReasons: unique(signalReasons.length ? signalReasons : ['특별한 위험 신호가 없습니다.']),
    guardianSummary,
    total: last24h.length,
    latest,
    hasEmergency,
    mealNeedsCheck,
    medicationNeedsCheck,
    conditionNeedsCheck,
    moodNeedsCheck,
    activityNeedsCheck,
    familyNextActions: unique(nextActions).slice(0, 4),
    latestResponseAt: latestTime ? new Date(latestTime).toISOString() : null,
    aiDisclaimer: '안부온 점수는 의료 진단이 아니라 안부 확인을 돕는 참고 신호입니다. 응급상황은 119에 연락하세요.'
  }
}

export function labelDailyCareType(type: DailyCareType) {
  const map: Record<DailyCareType, string> = {
    meal: '식사',
    medication: '약',
    condition: '상태',
    safe_return: '안전귀가',
    emergency: '도움요청'
  }

  return map[type] || type
}

export function labelDailyCareStatus(status: DailyCareStatus) {
  const map: Record<DailyCareStatus, string> = {
    done: '확인 완료',
    not_done: '미확인',
    needs_help: '확인 필요',
    unknown: '모름'
  }

  return map[status] || status
}
