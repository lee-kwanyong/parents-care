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
  checkType: DailyCareType
  careLabel: string
  status: DailyCareStatus
  title: string
  description: string
}> = [
  {
    checkType: 'meal',
    careLabel: '점심 식사',
    status: 'done',
    title: '점심 잘 먹었어요',
    description: '자녀에게 식사 안심 알림을 보냅니다.'
  },
  {
    checkType: 'meal',
    careLabel: '점심 식사',
    status: 'not_done',
    title: '아직 식사 전이에요',
    description: '식사 안심 확인이 필요하다고 표시됩니다.'
  },
  {
    checkType: 'medication',
    careLabel: '오늘 약',
    status: 'done',
    title: '약 잘 먹었어요',
    description: '자녀에게 복약 안심 알림을 보냅니다.'
  },
  {
    checkType: 'medication',
    careLabel: '오늘 약',
    status: 'not_done',
    title: '약 아직 식사 전이에요',
    description: '복약 안심 확인이 필요하다고 표시됩니다.'
  },
  {
    checkType: 'condition',
    careLabel: '오늘 컨디션',
    status: 'done',
    title: '컨디션 괜찮아요',
    description: '오늘 컨디션이 괜찮다고 안심 알림을 보냅니다.'
  },
  {
    checkType: 'emergency',
    careLabel: '안심케어 요청',
    status: 'needs_help',
    title: '도움이 필요해요',
    description: '자녀와 운영실에 바로 확인 요청을 보냅니다.'
  },
  {
    checkType: 'safe_return',
    careLabel: '안전 귀가',
    status: 'done',
    title: '집에 잘 도착했어요',
    description: '안전하게 도착했다고 표시됩니다.'
  }
]

export function buildDailyCareSummary(checkins: DailyCareCheckin[]) {
  const now = Date.now()
  const last24h = checkins.filter((item) => {
    const time = item.occurred_at ? new Date(item.occurred_at).getTime() : 0
    return Number.isFinite(time) && now - time <= 24 * 60 * 60 * 1000
  })

  const latestByKey = new Map<string, DailyCareCheckin>()

  for (const item of last24h) {
    const key = `${item.check_type}:${item.care_label}`
    const current = latestByKey.get(key)

    if (!current) {
      latestByKey.set(key, item)
      continue
    }

    const currentTime = current.occurred_at ? new Date(current.occurred_at).getTime() : 0
    const itemTime = item.occurred_at ? new Date(item.occurred_at).getTime() : 0

    if (itemTime > currentTime) {
      latestByKey.set(key, item)
    }
  }

  const latest = Array.from(latestByKey.values())

  const hasEmergency = latest.some((item) => item.status === 'needs_help' || item.check_type === 'emergency')
  const mealNeedsCheck = latest.some((item) => item.check_type === 'meal' && item.status === 'not_done')
  const medicationNeedsCheck = latest.some((item) => item.check_type === 'medication' && item.status === 'not_done')
  const safeReturnDone = latest.some((item) => item.check_type === 'safe_return' && item.status === 'done')

  const reassuranceState =
    hasEmergency
      ? '긴급'
      : mealNeedsCheck || medicationNeedsCheck
        ? '확인 필요'
        : latest.length > 0
          ? '안심'
          : '확인 필요'

  const familyNextActions: string[] = []

  if (hasEmergency) {
    familyNextActions.push('부모님께 바로 전화하거나 운영실 확인이 필요합니다.')
  }

  if (mealNeedsCheck) {
    familyNextActions.push('식사를 못 하신 이유를 확인해주세요.')
  }

  if (medicationNeedsCheck) {
    familyNextActions.push('약 복용 여부를 확인해주세요.')
  }

  if (!safeReturnDone) {
    familyNextActions.push('귀가 확인이 아직 없으면 확인해주세요.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('지금은 확인할 일이 없습니다.')
  }

  return {
    reassuranceState,
    total: last24h.length,
    latest,
    hasEmergency,
    mealNeedsCheck,
    medicationNeedsCheck,
    safeReturnDone,
    familyNextActions: familyNextActions.slice(0, 3)
  }
}

export function labelDailyCareType(type: DailyCareType) {
  const map: Record<DailyCareType, string> = {
    meal: '식사',
    medication: '약',
    condition: '컨디션',
    safe_return: '안전귀가',
    emergency: '도움요청'
  }

  return map[type] || type
}

export function labelDailyCareStatus(status: DailyCareStatus) {
  const map: Record<DailyCareStatus, string> = {
    done: '완료',
    not_done: '미확인',
    needs_help: '도움 필요',
    unknown: '모름'
  }

  return map[status] || status
}
