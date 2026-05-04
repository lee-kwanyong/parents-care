export type DischargePackStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type DischargeCheckStatus = 'planned' | 'done' | 'needs_attention' | 'skipped' | 'overdue'
export type MedicationStatus = 'unknown' | 'done' | 'not_done' | 'none'
export type MealStatus = 'unknown' | 'done' | 'not_done' | 'needs_support'
export type ConditionStatus = 'unknown' | 'good' | 'tired' | 'bad' | 'needs_help'

export type PostDischargeCarePack = {
  id: string
  elder_name: string
  guardian_name: string | null
  guardian_phone: string | null
  hospital_name: string | null
  discharge_date: string
  next_visit_date: string | null
  primary_diagnosis: string | null
  medication_risk: boolean
  meal_risk: boolean
  mobility_risk: boolean
  fall_risk: boolean
  status: DischargePackStatus
  memo: string | null
  ops_memo: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type PostDischargeDailyCheck = {
  id: string
  care_pack_id: string
  day_index: number
  check_date: string
  title: string
  check_focus: string
  status: DischargeCheckStatus
  medication_status: MedicationStatus
  meal_status: MealStatus
  condition_status: ConditionStatus
  pain_level: number | null
  family_note: string | null
  ops_note: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export const dischargeDayTemplates = [
  {
    dayIndex: 1,
    title: '퇴원 당일 확인',
    focus: '집에 잘 도착했는지, 처방약을 받았는지, 첫 식사가 가능한지 확인합니다.',
    familyAction: '퇴원 후 귀가, 약 봉투, 저녁 식사 가능 여부를 확인해주세요.'
  },
  {
    dayIndex: 2,
    title: '통증·컨디션 확인',
    focus: '통증, 어지러움, 식사 가능 여부를 확인합니다.',
    familyAction: '통증이 심하거나 식사를 못 하면 운영실에 알려주세요.'
  },
  {
    dayIndex: 3,
    title: '복약 확인',
    focus: '처방약을 빠뜨리지 않고 드셨는지 확인합니다.',
    familyAction: '아침·저녁 약 복용 여부를 확인해주세요.'
  },
  {
    dayIndex: 4,
    title: '식사·회복식 확인',
    focus: '식사량, 죽·연화식·저염식 필요 여부를 확인합니다.',
    familyAction: '식사가 어렵다면 안심밥상이나 회복식 연결을 검토해주세요.'
  },
  {
    dayIndex: 5,
    title: '가족 할 일 정리',
    focus: '서류, 다음 예약, 약 추가 확인 같은 가족 할 일을 정리합니다.',
    familyAction: '남은 서류와 다음 예약 여부를 확인해주세요.'
  },
  {
    dayIndex: 6,
    title: '다음 외래 확인',
    focus: '다음 외래나 검사 일정이 잡혔는지 확인합니다.',
    familyAction: '다음 외래 예약 후보를 확인해주세요.'
  },
  {
    dayIndex: 7,
    title: '7일 최종 안심 리포트',
    focus: '7일 동안의 약, 식사, 통증, 컨디션, 다음 예약을 정리합니다.',
    familyAction: '최종 상태를 확인하고 추가 케어가 필요한지 결정해주세요.'
  }
] as const

function addDaysYmd(ymd: string, days: number) {
  const [year, month, day] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

export function buildDefaultDischargeChecks(dischargeDate: string) {
  return dischargeDayTemplates.map((template) => ({
    day_index: template.dayIndex,
    check_date: addDaysYmd(dischargeDate, template.dayIndex - 1),
    title: template.title,
    check_focus: template.focus,
    status: 'planned' as DischargeCheckStatus,
    medication_status: 'unknown' as MedicationStatus,
    meal_status: 'unknown' as MealStatus,
    condition_status: 'unknown' as ConditionStatus,
    pain_level: null as number | null,
    family_note: template.familyAction,
    ops_note: null as string | null
  }))
}

export function labelDischargeCheckStatus(status: string) {
  const map: Record<string, string> = {
    planned: '예정',
    done: '완료',
    needs_attention: '주의 필요',
    skipped: '건너뜀',
    overdue: '지연'
  }

  return map[status] || status
}

export function labelMedicationStatus(status: string) {
  const map: Record<string, string> = {
    unknown: '모름',
    done: '복용함',
    not_done: '미복용',
    none: '해당 없음'
  }

  return map[status] || status
}

export function labelMealStatus(status: string) {
  const map: Record<string, string> = {
    unknown: '모름',
    done: '식사함',
    not_done: '식사 못 함',
    needs_support: '식사 도움 필요'
  }

  return map[status] || status
}

export function labelConditionStatus(status: string) {
  const map: Record<string, string> = {
    unknown: '모름',
    good: '괜찮음',
    tired: '피곤함',
    bad: '나쁨',
    needs_help: '도움 필요'
  }

  return map[status] || status
}

export function buildDischargeSummary(
  packs: PostDischargeCarePack[],
  checks: PostDischargeDailyCheck[]
) {
  const activePacks = packs.filter((pack) => pack.status === 'active')
  const activePackIds = new Set(activePacks.map((pack) => pack.id))
  const activeChecks = checks.filter((check) => activePackIds.has(check.care_pack_id))

  const needsAttention = activeChecks.filter((check) => check.status === 'needs_attention' || check.status === 'overdue')
  const overdue = activeChecks.filter((check) => {
    if (check.status === 'done' || check.status === 'skipped') return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(check.check_date + 'T00:00:00')
    return date.getTime() < today.getTime()
  })

  const done = activeChecks.filter((check) => check.status === 'done')
  const planned = activeChecks.filter((check) => check.status === 'planned')

  const medicationRisk = activePacks.some((pack) => pack.medication_risk)
  const mealRisk = activePacks.some((pack) => pack.meal_risk)
  const fallRisk = activePacks.some((pack) => pack.fall_risk || pack.mobility_risk)

  const reassuranceState =
    needsAttention.length > 0 || overdue.length > 0
      ? '확인 필요'
      : activePacks.length > 0
        ? '안심'
        : '확인 필요'

  const familyNextActions: string[] = []

  if (needsAttention.length > 0) {
    familyNextActions.push('주의 필요로 표시된 퇴원 후 체크를 확인해주세요.')
  }

  if (overdue.length > 0) {
    familyNextActions.push('지연된 퇴원 후 체크가 있습니다.')
  }

  if (medicationRisk) {
    familyNextActions.push('처방약 복용 여부를 확인해주세요.')
  }

  if (mealRisk) {
    familyNextActions.push('식사 가능 여부와 회복식 필요 여부를 확인해주세요.')
  }

  if (fallRisk) {
    familyNextActions.push('낙상 위험과 이동 보조 필요 여부를 확인해주세요.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('지금은 확인할 일이 없습니다.')
  }

  return {
    reassuranceState,
    activePackTotal: activePacks.length,
    checkTotal: activeChecks.length,
    doneTotal: done.length,
    plannedTotal: planned.length,
    needsAttentionTotal: needsAttention.length + overdue.length,
    medicationRisk,
    mealRisk,
    fallRisk,
    familyNextActions: Array.from(new Set(familyNextActions)).slice(0, 3)
  }
}
