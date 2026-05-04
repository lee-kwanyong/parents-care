export type RoutineType =
  | 'appointment'
  | 'medication'
  | 'meal'
  | 'wellbeing'
  | 'rehab'
  | 'documents'
  | 'custom'

export type CadenceType =
  | 'once'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'every_3_months'
  | 'every_6_months'
  | 'yearly'
  | 'custom'

export type RoutineStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export type NextVisitStatus =
  | 'draft'
  | 'family_review'
  | 'appointment_requested'
  | 'booked'
  | 'done'
  | 'cancelled'

export type RoutinePriority = 'low' | 'normal' | 'high' | 'urgent'

export type CareRoutineSchedule = {
  id: string
  elder_name: string
  routine_type: RoutineType
  title: string
  hospital_name: string | null
  department: string | null
  doctor_name: string | null
  cadence_type: CadenceType
  cadence_interval_days: number | null
  next_due_date: string | null
  preferred_day: string | null
  preferred_time: string | null
  family_owner_name: string | null
  family_owner_phone: string | null
  status: RoutineStatus
  reminder_channel: string
  memo: string | null
  ops_memo: string | null
  created_at: string
  updated_at: string
}

export type CareNextVisitDraft = {
  id: string
  routine_schedule_id: string | null
  elder_name: string
  title: string
  hospital_name: string | null
  department: string | null
  doctor_name: string | null
  suggested_date: string | null
  preferred_time: string | null
  reason: string
  status: NextVisitStatus
  priority: RoutinePriority
  family_owner_name: string | null
  family_owner_phone: string | null
  memo: string | null
  ops_memo: string | null
  booked_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export const routineTypeOptions: Array<{
  code: RoutineType
  label: string
  description: string
}> = [
  {
    code: 'appointment',
    label: '정기진료',
    description: '혈압, 당뇨, 정형외과, 안과, 치과처럼 반복되는 진료'
  },
  {
    code: 'rehab',
    label: '재활·물리치료',
    description: '물리치료, 도수치료, 재활치료처럼 반복 관리가 필요한 일정'
  },
  {
    code: 'medication',
    label: '약 확인',
    description: '정기 처방, 약 변경, 복용 확인'
  },
  {
    code: 'meal',
    label: '식사 확인',
    description: '안심밥상, 회복식, 정기 식사 확인'
  },
  {
    code: 'wellbeing',
    label: '안부 확인',
    description: '혼자 계신 부모님 안부, 컨디션 확인'
  },
  {
    code: 'documents',
    label: '서류 챙김',
    description: '정기 보험서류, 검사결과지, 진단서 확인'
  },
  {
    code: 'custom',
    label: '기타',
    description: '가족이 직접 정한 반복 케어'
  }
]

export const cadenceOptions: Array<{
  code: CadenceType
  label: string
  intervalDays: number | null
}> = [
  { code: 'once', label: '한 번만', intervalDays: null },
  { code: 'weekly', label: '매주', intervalDays: 7 },
  { code: 'biweekly', label: '2주마다', intervalDays: 14 },
  { code: 'monthly', label: '매달', intervalDays: 30 },
  { code: 'every_3_months', label: '3개월마다', intervalDays: 90 },
  { code: 'every_6_months', label: '6개월마다', intervalDays: 180 },
  { code: 'yearly', label: '1년마다', intervalDays: 365 },
  { code: 'custom', label: '직접 입력', intervalDays: null }
]

export function labelRoutineType(type: string) {
  return routineTypeOptions.find((option) => option.code === type)?.label || type
}

export function labelCadence(type: string) {
  return cadenceOptions.find((option) => option.code === type)?.label || type
}

export function labelRoutineStatus(status: string) {
  const map: Record<string, string> = {
    active: '활성',
    paused: '일시중지',
    completed: '완료',
    cancelled: '취소'
  }

  return map[status] || status
}

export function labelNextVisitStatus(status: string) {
  const map: Record<string, string> = {
    draft: '초안',
    family_review: '가족 확인',
    appointment_requested: '예약 요청',
    booked: '예약 완료',
    done: '완료',
    cancelled: '취소'
  }

  return map[status] || status
}

export function intervalDaysForCadence(cadence: CadenceType, customDays?: number | null) {
  if (cadence === 'custom') return customDays && customDays > 0 ? customDays : 30
  return cadenceOptions.find((option) => option.code === cadence)?.intervalDays || null
}

export function calculateNextDueDate(baseDate: string, cadence: CadenceType, customDays?: number | null) {
  if (!baseDate) return null

  const base = new Date(baseDate + 'T09:00:00')
  if (!Number.isFinite(base.getTime())) return null

  const interval = intervalDaysForCadence(cadence, customDays)
  if (!interval) return baseDate

  const next = new Date(base)
  next.setDate(next.getDate() + interval)
  return next.toISOString().slice(0, 10)
}

export function inferRoutinePriority(routineType: RoutineType, nextDueDate?: string | null): RoutinePriority {
  if (!nextDueDate) return 'normal'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(nextDueDate + 'T00:00:00')
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

  if (diffDays < 0) return 'urgent'
  if (diffDays <= 7) return 'high'
  if (routineType === 'medication') return 'high'
  return 'normal'
}

export function buildRoutineSummary(routines: CareRoutineSchedule[], drafts: CareNextVisitDraft[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const active = routines.filter((routine) => routine.status === 'active')

  const overdueRoutines = active.filter((routine) => {
    if (!routine.next_due_date) return true
    const due = new Date(routine.next_due_date + 'T00:00:00')
    return due.getTime() < today.getTime()
  })

  const soonRoutines = active.filter((routine) => {
    if (!routine.next_due_date) return false
    const due = new Date(routine.next_due_date + 'T00:00:00')
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    return diffDays >= 0 && diffDays <= 14
  })

  const openDrafts = drafts.filter((draft) => !['booked', 'done', 'cancelled'].includes(draft.status))
  const appointmentRequested = drafts.filter((draft) => draft.status === 'appointment_requested')
  const booked = drafts.filter((draft) => draft.status === 'booked')

  const reassuranceState =
    overdueRoutines.length > 0
      ? '긴급'
      : soonRoutines.length > 0 || openDrafts.length > 0
        ? '확인 필요'
        : '안심'

  const familyNextActions: string[] = []

  if (overdueRoutines.length > 0) {
    familyNextActions.push('지난 정기진료가 있습니다. 운영실 또는 병원 예약을 확인해주세요.')
  }

  if (soonRoutines.length > 0) {
    familyNextActions.push('곧 필요한 정기진료가 있습니다. 다음 예약을 맡길지 선택해주세요.')
  }

  if (appointmentRequested.length > 0) {
    familyNextActions.push('예약 요청 중인 일정이 있습니다. 예약 완료 여부를 확인해주세요.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('지금은 정기진료 확인이 필요한 일이 없습니다.')
  }

  return {
    reassuranceState,
    routineTotal: routines.length,
    activeTotal: active.length,
    overdueTotal: overdueRoutines.length,
    soonTotal: soonRoutines.length,
    openDraftTotal: openDrafts.length,
    bookedTotal: booked.length,
    topRoutines: [...overdueRoutines, ...soonRoutines].slice(0, 3),
    familyNextActions: familyNextActions.slice(0, 3)
  }
}
