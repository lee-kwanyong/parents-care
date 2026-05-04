export type MealSupportType =
  | 'check_only'
  | 'regular_delivery'
  | 'recovery_7days'
  | 'diet_consult'
  | 'social_support'

export type MealDietType =
  | 'normal'
  | 'soft_food'
  | 'porridge'
  | 'low_sodium'
  | 'diabetes_friendly'
  | 'post_discharge_recovery'
  | 'unknown'

export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type MealRequestStatus =
  | 'requested'
  | 'reviewing'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'

export type MealStatus =
  | 'planned'
  | 'delivered'
  | 'eaten'
  | 'not_eaten'
  | 'needs_help'
  | 'skipped'
  | 'failed'

export type DeliveryStatus =
  | 'none'
  | 'scheduled'
  | 'delivered'
  | 'failed'

export type MealSupportRequest = {
  id: string
  elder_name: string
  guardian_name: string | null
  guardian_phone: string | null
  support_type: MealSupportType
  diet_type: MealDietType
  meal_times: MealTime[]
  start_date: string
  end_date: string | null
  delivery_address: string | null
  delivery_note: string | null
  social_care_requested: boolean
  status: MealRequestStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  memo: string | null
  ops_memo: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type MealServiceEvent = {
  id: string
  meal_support_request_id: string
  event_date: string
  meal_time: MealTime
  meal_status: MealStatus
  delivery_status: DeliveryStatus
  check_source: string
  memo: string | null
  ops_memo: string | null
  checked_at: string | null
  created_at: string
  updated_at: string
}

export const mealSupportOptions: Array<{
  code: MealSupportType
  label: string
  description: string
}> = [
  {
    code: 'check_only',
    label: '식사 확인만 하기',
    description: '부모님이 드셨는지 큰 버튼이나 전화로 확인합니다.'
  },
  {
    code: 'regular_delivery',
    label: '안심밥상 정기배송',
    description: '도시락, 반찬, 죽, 부드러운 식사를 정기적으로 연결합니다.'
  },
  {
    code: 'recovery_7days',
    label: '퇴원 후 회복식 7일',
    description: '퇴원 직후 부드러운 식사와 식사 여부를 7일 동안 확인합니다.'
  },
  {
    code: 'diet_consult',
    label: '식단 상담',
    description: '저염식, 당뇨식, 연화식, 죽처럼 식단 조건을 정리합니다.'
  },
  {
    code: 'social_support',
    label: '공공·후원 식사 연결',
    description: '비용 부담이 있거나 결식 우려가 있으면 공공지원과 후원 연결을 검토합니다.'
  }
]

export const mealDietOptions: Array<{
  code: MealDietType
  label: string
  description: string
}> = [
  {
    code: 'normal',
    label: '일반식',
    description: '특별한 제한이 없는 기본 식사'
  },
  {
    code: 'soft_food',
    label: '씹기 쉬운 음식',
    description: '딱딱한 음식이 어려운 부모님'
  },
  {
    code: 'porridge',
    label: '죽·부드러운 식사',
    description: '퇴원 직후 또는 소화가 약한 부모님'
  },
  {
    code: 'low_sodium',
    label: '저염식',
    description: '혈압, 심장, 신장 등 염분 조절이 필요한 경우'
  },
  {
    code: 'diabetes_friendly',
    label: '당뇨식',
    description: '당 조절이 필요한 부모님'
  },
  {
    code: 'post_discharge_recovery',
    label: '퇴원 후 회복식',
    description: '퇴원 후 체력 회복을 돕는 식사'
  },
  {
    code: 'unknown',
    label: '잘 모르겠어요',
    description: '운영실이 식사 조건을 함께 정리합니다.'
  }
]

export const mealTimeOptions: Array<{
  code: MealTime
  label: string
}> = [
  { code: 'breakfast', label: '아침' },
  { code: 'lunch', label: '점심' },
  { code: 'dinner', label: '저녁' },
  { code: 'snack', label: '간식' }
]

export function labelMealSupportType(type: string) {
  return mealSupportOptions.find((option) => option.code === type)?.label || type
}

export function labelMealDietType(type: string) {
  return mealDietOptions.find((option) => option.code === type)?.label || type
}

export function labelMealTime(type: string) {
  return mealTimeOptions.find((option) => option.code === type)?.label || type
}

export function labelMealStatus(status: string) {
  const map: Record<string, string> = {
    planned: '예정',
    delivered: '배송됨',
    eaten: '드셨어요',
    not_eaten: '못 드셨어요',
    needs_help: '도움 필요',
    skipped: '건너뜀',
    failed: '문제 발생'
  }

  return map[status] || status
}

export function labelDeliveryStatus(status: string) {
  const map: Record<string, string> = {
    none: '배송 없음',
    scheduled: '배송 예정',
    delivered: '배송 완료',
    failed: '배송 실패'
  }

  return map[status] || status
}

function addDaysYmd(ymd: string, days: number) {
  const [year, month, day] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

export function normalizeMealTimes(input: unknown): MealTime[] {
  const raw = Array.isArray(input) ? input.map(String) : []
  const allowed = new Set(mealTimeOptions.map((item) => item.code))
  const result = raw.filter((item): item is MealTime => allowed.has(item as MealTime))
  return result.length > 0 ? Array.from(new Set(result)) : ['lunch']
}

export function durationForSupportType(type: MealSupportType, customDays?: number | null) {
  if (customDays && customDays > 0) return customDays
  if (type === 'recovery_7days') return 7
  if (type === 'regular_delivery') return 7
  if (type === 'social_support') return 7
  return 3
}

export function defaultDeliveryStatus(type: MealSupportType): DeliveryStatus {
  if (type === 'regular_delivery' || type === 'recovery_7days' || type === 'social_support') {
    return 'scheduled'
  }

  return 'none'
}

export function buildMealEvents(input: {
  requestId: string
  supportType: MealSupportType
  startDate: string
  mealTimes: MealTime[]
  durationDays: number
}) {
  const deliveryStatus = defaultDeliveryStatus(input.supportType)
  const rows: Array<{
    meal_support_request_id: string
    event_date: string
    meal_time: MealTime
    meal_status: MealStatus
    delivery_status: DeliveryStatus
    check_source: string
    memo: string | null
  }> = []

  for (let day = 0; day < input.durationDays; day += 1) {
    const eventDate = addDaysYmd(input.startDate, day)

    for (const mealTime of input.mealTimes) {
      rows.push({
        meal_support_request_id: input.requestId,
        event_date: eventDate,
        meal_time: mealTime,
        meal_status: 'planned',
        delivery_status: deliveryStatus,
        check_source: 'system',
        memo: null
      })
    }
  }

  return rows
}

export function inferMealPriority(input: {
  supportType: MealSupportType
  dietType: MealDietType
  socialCareRequested: boolean
}) {
  if (input.socialCareRequested) return 'high'
  if (input.supportType === 'recovery_7days') return 'high'
  if (input.dietType === 'diabetes_friendly' || input.dietType === 'low_sodium') return 'high'
  if (input.dietType === 'post_discharge_recovery') return 'high'
  return 'normal'
}

export function buildMealCareSummary(
  requests: MealSupportRequest[],
  events: MealServiceEvent[]
) {
  const activeRequestIds = new Set(
    requests
      .filter((request) => !['completed', 'cancelled'].includes(request.status))
      .map((request) => request.id)
  )

  const activeEvents = events.filter((event) => activeRequestIds.has(event.meal_support_request_id))

  const needsHelp = activeEvents.filter((event) => event.meal_status === 'needs_help')
  const notEaten = activeEvents.filter((event) => event.meal_status === 'not_eaten')
  const failedDelivery = activeEvents.filter((event) => event.delivery_status === 'failed' || event.meal_status === 'failed')
  const eaten = activeEvents.filter((event) => event.meal_status === 'eaten')
  const delivered = activeEvents.filter((event) => event.delivery_status === 'delivered')
  const socialCare = requests.filter((request) => request.social_care_requested && !['completed', 'cancelled'].includes(request.status))

  const reassuranceState =
    needsHelp.length > 0
      ? '긴급'
      : notEaten.length > 0 || failedDelivery.length > 0 || socialCare.length > 0
        ? '확인 필요'
        : activeEvents.length > 0
          ? '안심'
          : '확인 필요'

  const familyNextActions: string[] = []

  if (needsHelp.length > 0) {
    familyNextActions.push('식사 도움이 필요하다고 표시되었습니다. 부모님께 바로 확인해주세요.')
  }

  if (notEaten.length > 0) {
    familyNextActions.push('식사를 못 드신 기록이 있습니다. 이유를 확인해주세요.')
  }

  if (failedDelivery.length > 0) {
    familyNextActions.push('식사 배송 문제가 있습니다. 운영실 확인이 필요합니다.')
  }

  if (socialCare.length > 0) {
    familyNextActions.push('공공지원·후원 식사 연결 요청이 있습니다.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('지금은 식사 관련 확인할 일이 없습니다.')
  }

  return {
    reassuranceState,
    requestTotal: requests.length,
    activeRequestTotal: activeRequestIds.size,
    eventTotal: activeEvents.length,
    needsHelpTotal: needsHelp.length,
    notEatenTotal: notEaten.length,
    failedDeliveryTotal: failedDelivery.length,
    eatenTotal: eaten.length,
    deliveredTotal: delivered.length,
    socialCareTotal: socialCare.length,
    familyNextActions: Array.from(new Set(familyNextActions)).slice(0, 3)
  }
}
