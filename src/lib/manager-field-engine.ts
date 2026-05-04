export type ManagerAssignmentType =
  | 'hospital_visit'
  | 'meal_check'
  | 'discharge_check'
  | 'document_pickup'
  | 'check_call'
  | 'wellbeing'
  | 'custom'

export type TransportMode =
  | 'hospital_meet'
  | 'home_meet_taxi_companion'
  | 'mobility_partner'
  | 'guardian_arranged'
  | 'no_transport'

export type ManagerAssignmentStatus =
  | 'assigned'
  | 'accepted'
  | 'en_route'
  | 'met_parent'
  | 'at_hospital'
  | 'in_consultation'
  | 'pharmacy'
  | 'documents'
  | 'meal_check'
  | 'safe_return'
  | 'reporting'
  | 'completed'
  | 'issue'
  | 'cancelled'

export type ChecklistStatus = 'pending' | 'done' | 'issue' | 'skipped'
export type ChecklistPriority = 'low' | 'normal' | 'high' | 'urgent'

export type ManagerFieldAssignment = {
  id: string
  elder_name: string
  manager_name: string
  manager_phone: string | null
  assignment_type: ManagerAssignmentType
  title: string
  appointment_date: string | null
  appointment_time: string | null
  meeting_location: string | null
  meeting_code: string
  transport_mode: TransportMode
  vehicle_owned: boolean
  direct_transport_included: boolean
  transport_policy_acknowledged: boolean
  status: ManagerAssignmentStatus
  care_passport_snapshot: any
  safety_notes: string[]
  guardian_questions: string[]
  required_documents: string[]
  ops_memo: string | null
  manager_memo: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  total_checklist?: number
  done_checklist?: number
  issue_checklist?: number
}

export type ManagerFieldChecklistItem = {
  id: string
  assignment_id: string
  checklist_type: string
  title: string
  description: string | null
  status: ChecklistStatus
  priority: ChecklistPriority
  completed_at: string | null
  issue_note: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type ManagerProgressEvent = {
  id: string
  assignment_id: string
  event_type: string
  title: string
  description: string | null
  status_after: string | null
  actor_role: string
  severity: 'info' | 'attention' | 'urgent'
  created_at: string
}

export type CarePassportSnapshot = {
  elder_name?: string
  hearing_attention?: boolean
  mobility_attention?: boolean
  allergy_status?: string
  has_medications?: boolean
  fall_risk_level?: string
  body_conditions?: Array<{ label?: string; managerTip?: string }>
  allergies?: Array<{ memo?: string; status?: string }>
  medications?: Array<{ memo?: string }>
  diet_needs?: Array<{ label?: string }>
  communication_notes?: string
  emergency_notes?: string
  care_summary?: {
    managerTips?: string[]
    familyQuestions?: string[]
    reassuranceWarnings?: string[]
    oneMinuteSummary?: string
  }
}

export const assignmentTypeOptions: Array<{
  code: ManagerAssignmentType
  label: string
  description: string
}> = [
  {
    code: 'hospital_visit',
    label: '병원동행',
    description: '병원 접수, 진료 동행, 약국, 서류, 귀가 확인'
  },
  {
    code: 'meal_check',
    label: '식사 확인',
    description: '식사 여부, 안심밥상, 회복식, 식사 도움 확인'
  },
  {
    code: 'discharge_check',
    label: '퇴원 후 확인',
    description: '퇴원 후 약, 식사, 통증, 낙상 위험 확인'
  },
  {
    code: 'document_pickup',
    label: '서류 수령',
    description: '영수증, 세부내역서, 처방전, 통원확인서 확인'
  },
  {
    code: 'check_call',
    label: '안부 전화',
    description: '전화 또는 방문 전 상태 확인'
  },
  {
    code: 'wellbeing',
    label: '생활 안부',
    description: '식사, 약, 컨디션, 생활 위험 확인'
  },
  {
    code: 'custom',
    label: '기타',
    description: '운영실이 직접 지정한 현장 업무'
  }
]

export const transportModeOptions: Array<{
  code: TransportMode
  label: string
  description: string
}> = [
  {
    code: 'hospital_meet',
    label: '병원 앞 만남',
    description: '기본 방식. 병원 앞 또는 접수처에서 만납니다.'
  },
  {
    code: 'home_meet_taxi_companion',
    label: '집 앞 만남 후 택시 동행',
    description: '매니저가 택시 이동에 동행합니다. 개인차량 직접 운송과 다릅니다.'
  },
  {
    code: 'mobility_partner',
    label: '이동지원 제휴',
    description: '제휴 이동지원 서비스와 연결합니다.'
  },
  {
    code: 'guardian_arranged',
    label: '보호자 이동 준비',
    description: '가족이 이동수단을 준비합니다.'
  },
  {
    code: 'no_transport',
    label: '이동 없음',
    description: '전화 확인, 서류 수령 등 이동이 없는 업무입니다.'
  }
]

export const managerStatusFlow: Array<{
  status: ManagerAssignmentStatus
  label: string
}> = [
  { status: 'accepted', label: '배정 확인' },
  { status: 'en_route', label: '이동 중' },
  { status: 'met_parent', label: '부모님 만남' },
  { status: 'at_hospital', label: '병원 도착/접수' },
  { status: 'in_consultation', label: '진료 중' },
  { status: 'pharmacy', label: '약국/처방 확인' },
  { status: 'documents', label: '서류 확인' },
  { status: 'meal_check', label: '식사/컨디션 확인' },
  { status: 'safe_return', label: '안전 귀가 확인' },
  { status: 'reporting', label: '리포트 작성' },
  { status: 'completed', label: '완료' },
  { status: 'issue', label: '문제 발생' }
]

export function labelAssignmentType(type: string) {
  return assignmentTypeOptions.find((option) => option.code === type)?.label || type
}

export function labelTransportMode(type: string) {
  return transportModeOptions.find((option) => option.code === type)?.label || type
}

export function labelManagerStatus(status: string) {
  const found = managerStatusFlow.find((item) => item.status === status)
  if (found) return found.label

  const map: Record<string, string> = {
    assigned: '배정됨',
    cancelled: '취소'
  }

  return map[status] || status
}

export function buildManagerSafetyNotes(passport?: CarePassportSnapshot | null) {
  const notes: string[] = []

  if (!passport) {
    return ['케어패스포트가 없으므로 현장에서 청력, 통증, 알러지, 복용약을 직접 확인하세요.']
  }

  if (passport.hearing_attention) {
    notes.push('청력 주의: 잘 들리는 방향에서 천천히 설명하세요.')
  }

  if (passport.mobility_attention) {
    notes.push('이동 주의: 계단, 턱, 화장실, 긴 대기를 주의하세요.')
  }

  if (passport.allergy_status === 'yes') {
    notes.push('알러지 있음: 약·음식·검사 전 보호자 확인이 필요합니다.')
  } else if (passport.allergy_status === 'unknown') {
    notes.push('알러지 유무 미확인: 약·음식 안내 전 보호자 확인이 필요합니다.')
  }

  if (passport.has_medications) {
    notes.push('복용약 있음: 병원 접수와 진료 시 약 정보를 확인하세요.')
  } else {
    notes.push('복용약 미확인: 약 봉투나 기존 복용약을 확인하세요.')
  }

  if (passport.fall_risk_level === 'high') {
    notes.push('낙상 고위험: 이동 시 보행 속도를 맞추고 턱·계단을 먼저 안내하세요.')
  }

  for (const item of passport.body_conditions || []) {
    if (item.label) notes.push(item.label)
    if (item.managerTip) notes.push(item.managerTip)
  }

  for (const allergy of passport.allergies || []) {
    if (allergy.memo) notes.push(`알러지 메모: ${allergy.memo}`)
  }

  for (const medication of passport.medications || []) {
    if (medication.memo) notes.push(`복용약 메모: ${medication.memo}`)
  }

  for (const diet of passport.diet_needs || []) {
    if (diet.label) notes.push(`식사 조건: ${diet.label}`)
  }

  if (passport.communication_notes) {
    notes.push(`응대 메모: ${passport.communication_notes}`)
  }

  if (passport.emergency_notes) {
    notes.push(`긴급 메모: ${passport.emergency_notes}`)
  }

  if (Array.isArray(passport.care_summary?.managerTips)) {
    notes.push(...passport.care_summary.managerTips)
  }

  return Array.from(new Set(notes)).slice(0, 12)
}

export function buildDefaultManagerChecklist(input: {
  assignmentType: ManagerAssignmentType
  transportMode: TransportMode
  passport?: CarePassportSnapshot | null
  requiredDocuments?: string[]
  guardianQuestions?: string[]
}) {
  const passport = input.passport
  const items: Array<{
    checklist_type: string
    title: string
    description: string
    priority: ChecklistPriority
    sort_order: number
  }> = []

  items.push({
    checklist_type: 'meeting_code',
    title: '만남 암호 확인',
    description: '부모님 화면의 만남 암호와 현장 암호가 일치하는지 확인합니다.',
    priority: 'urgent',
    sort_order: 10
  })

  items.push({
    checklist_type: 'transport_policy',
    title: '이동 방식과 차량 정책 확인',
    description: '차량 보유는 참고 정보입니다. 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.',
    priority: 'urgent',
    sort_order: 20
  })

  items.push({
    checklist_type: 'care_passport',
    title: '케어패스포트 확인',
    description: '청력, 통증, 알러지, 복용약, 낙상 위험을 현장 전에 확인합니다.',
    priority: 'high',
    sort_order: 30
  })

  if (passport?.hearing_attention) {
    items.push({
      checklist_type: 'hearing',
      title: '청력 주의 확인',
      description: '잘 들리는 방향에서 천천히 설명합니다.',
      priority: 'high',
      sort_order: 40
    })
  }

  if (passport?.mobility_attention || passport?.fall_risk_level === 'high') {
    items.push({
      checklist_type: 'mobility',
      title: '이동·낙상 주의 확인',
      description: '계단, 턱, 화장실 이동, 병원 대기 동선을 주의합니다.',
      priority: passport?.fall_risk_level === 'high' ? 'urgent' : 'high',
      sort_order: 50
    })
  }

  items.push({
    checklist_type: 'allergy',
    title: '알러지 유무 확인',
    description: passport?.allergy_status === 'yes'
      ? '알러지가 있습니다. 약·음식·검사 전 보호자 확인이 필요합니다.'
      : '알러지 없음 또는 미확인 여부를 현장에서 확인합니다.',
    priority: passport?.allergy_status === 'yes' ? 'urgent' : 'high',
    sort_order: 60
  })

  items.push({
    checklist_type: 'medication',
    title: '복용약 확인',
    description: passport?.has_medications
      ? '기존 복용약이 있습니다. 약 봉투와 진료 안내를 확인합니다.'
      : '복용약 여부를 보호자 또는 부모님께 확인합니다.',
    priority: 'high',
    sort_order: 70
  })

  if (input.assignmentType === 'hospital_visit') {
    items.push(
      {
        checklist_type: 'hospital_reception',
        title: '병원 접수 확인',
        description: '접수층, 대기번호, 진료과를 확인합니다.',
        priority: 'normal',
        sort_order: 80
      },
      {
        checklist_type: 'doctor_questions',
        title: '보호자 질문 리스트 확인',
        description: (input.guardianQuestions ?? []).length > 0
          ? (input.guardianQuestions ?? []).join(' / ')
          : '의사에게 확인할 질문이 있으면 운영실 또는 보호자에게 확인합니다.',
        priority: 'normal',
        sort_order: 90
      },
      {
        checklist_type: 'pharmacy',
        title: '약국·처방 확인',
        description: '처방약 수령, 복용법, 약 변경 여부를 확인합니다.',
        priority: 'high',
        sort_order: 100
      }
    )
  }

  if (input.assignmentType === 'document_pickup' || input.assignmentType === 'hospital_visit') {
    items.push({
      checklist_type: 'documents',
      title: '서류·영수증 확인',
      description: (input.requiredDocuments ?? []).length > 0
        ? (input.requiredDocuments ?? []).join(' / ')
        : '영수증, 세부내역서, 처방전, 통원확인서 필요 여부를 확인합니다.',
      priority: 'normal',
      sort_order: 110
    })
  }

  if (input.assignmentType === 'meal_check' || input.assignmentType === 'discharge_check' || input.assignmentType === 'wellbeing') {
    items.push({
      checklist_type: 'meal_condition',
      title: '식사·컨디션 확인',
      description: '식사 여부, 회복식 필요, 컨디션, 통증을 확인합니다.',
      priority: 'high',
      sort_order: 120
    })
  }

  items.push(
    {
      checklist_type: 'safe_return',
      title: '안전 종료 확인',
      description: '귀가, 보호자 공유, 다음 액션을 확인합니다.',
      priority: 'high',
      sort_order: 130
    },
    {
      checklist_type: 'report_draft',
      title: '보호자 30초 리포트 초안 작성',
      description: '진료/식사/약/서류/컨디션/가족 할 일을 짧게 정리합니다.',
      priority: 'normal',
      sort_order: 140
    }
  )

  return items
}

export function buildManagerReportSummary(input: {
  assignment: ManagerFieldAssignment
  checklist: ManagerFieldChecklistItem[]
}) {
  const issues = input.checklist.filter((item) => item.status === 'issue')
  const done = input.checklist.filter((item) => item.status === 'done')

  const reassuranceState = issues.length > 0 ? '확인 필요' : input.assignment.status === 'completed' ? '안심' : '확인 필요'

  const nextActions: string[] = []

  if (issues.length > 0) {
    nextActions.push('현장 이슈를 보호자와 운영실이 확인해야 합니다.')
  }

  if (input.checklist.some((item) => item.checklist_type === 'medication' && item.status === 'done')) {
    nextActions.push('약 복용법과 변경 사항을 가족이 확인해주세요.')
  }

  if (input.checklist.some((item) => item.checklist_type === 'documents' && item.status === 'done')) {
    nextActions.push('수령한 서류를 가족에게 전달했는지 확인해주세요.')
  }

  if (nextActions.length === 0) {
    nextActions.push('추가 확인할 일이 있으면 운영실이 안내합니다.')
  }

  return {
    reassuranceState,
    oneLine: `${input.assignment.elder_name} 케어 진행상태는 ${reassuranceState}입니다. 체크 완료 ${done.length}개, 이슈 ${issues.length}개입니다.`,
    nextActions: nextActions.slice(0, 3)
  }
}
