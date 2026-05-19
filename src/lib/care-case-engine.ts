export type CareCaseType =
  | 'parent_care'
  | 'hospital_day'
  | 'meal_care'
  | 'medication'
  | 'discharge'
  | 'documents'
  | 'routine'
  | 'social_support'
  | 'emergency'
  | 'custom'

export type CareCaseStatus =
  | 'draft'
  | 'active'
  | 'waiting_family'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'archived'

export type CareCaseReassurance = '안심' | '확인 필요' | '긴급'
export type CareCasePriority = 'low' | 'normal' | 'high' | 'urgent'

export type CareCaseLinkType =
  | 'care_intake'
  | 'assisted_intake'
  | 'care_passport'
  | 'daily_care'
  | 'family_task'
  | 'documents'
  | 'routine'
  | 'next_visit'
  | 'discharge'
  | 'meal'
  | 'social_support'
  | 'communication_task'
  | 'summary_30sec'
  | 'manager_field'
  | 'cost_approval'
  | 'manual'

export type CareCase = {
  id: string
  elder_name: string
  guardian_name: string | null
  guardian_phone: string | null
  case_title: string
  case_type: CareCaseType
  status: CareCaseStatus
  reassurance_state: CareCaseReassurance
  priority: CareCasePriority
  summary_text: string | null
  family_next_actions: string[]
  important_notes: string[]
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type CareCaseLink = {
  id: string
  care_case_id: string
  link_type: CareCaseLinkType
  source_id: string | null
  source_label: string
  source_status: string | null
  source_url: string | null
  snapshot: Record<string, unknown>
  created_at: string
}

export type CareCaseTimelineEvent = {
  id: string
  care_case_id: string
  event_type: string
  title: string
  description: string | null
  event_status: string | null
  actor_role: 'family' | 'ops' | 'manager' | 'system'
  severity: 'info' | 'attention' | 'urgent'
  occurred_at: string
  created_at: string
}

export type CareCaseLinkCandidate = {
  link_type: CareCaseLinkType
  source_id: string | null
  source_label: string
  source_status: string | null
  source_url: string | null
  snapshot: Record<string, unknown>
}

export const careCaseTypeOptions: Array<{
  code: CareCaseType
  label: string
  description: string
}> = [
  {
    code: 'parent_care',
    label: '부모님 통합 케어',
    description: '병원·식사·약·서류·비용·매니저·요약을 한 번에 묶습니다.'
  },
  {
    code: 'hospital_day',
    label: '병원 가는 날',
    description: '병원동행, 약국, 서류, 비용, 매니저 현장을 묶습니다.'
  },
  {
    code: 'meal_care',
    label: '식사 케어',
    description: '안심밥상, 식사 확인, 배송, 가족 할 일을 묶습니다.'
  },
  {
    code: 'discharge',
    label: '퇴원 후 케어',
    description: '퇴원 후 7일, 약, 식사, 통증, 다음 외래를 묶습니다.'
  },
  {
    code: 'documents',
    label: '서류·영수증',
    description: '영수증, 세부내역서, 처방전, 보험서류를 묶습니다.'
  },
  {
    code: 'social_support',
    label: '사회공헌 연결',
    description: '공공지원, 후원 쿠폰, 식사 지원, 안부 확인을 묶습니다.'
  },
  {
    code: 'custom',
    label: '직접 만들기',
    description: '운영실이 직접 케이스를 구성합니다.'
  }
]

export function labelCareCaseType(type: string) {
  return careCaseTypeOptions.find((option) => option.code === type)?.label || type
}

export function labelCareCaseStatus(status: string) {
  const map: Record<string, string> = {
    draft: '초안',
    active: '진행 중',
    waiting_family: '가족 확인 대기',
    in_progress: '처리 중',
    completed: '완료',
    cancelled: '취소',
    archived: '보관'
  }

  return map[status] || status
}

export function labelCaseLinkType(type: string) {
  const map: Record<string, string> = {
    care_intake: '안심케어 접수',
    assisted_intake: '사진·카톡 접수',
    care_passport: '케어패스포트',
    daily_care: '밥·약·컨디션',
    family_task: '가족 할 일',
    documents: '서류·영수증',
    routine: '정기진료',
    next_visit: '다음 예약',
    discharge: '퇴원 후 7일',
    meal: '안심밥상',
    social_support: '사회공헌',
    communication_task: '연락 작업',
    summary_30sec: '30초 요약',
    manager_field: '매니저 현장',
    cost_approval: '비용 승인',
    manual: '수동 연결'
  }

  return map[type] || type
}

export function isAttentionStatus(status?: string | null) {
  if (!status) return false
  const value = status.toLowerCase()

  return [
    'issue',
    'needs_help',
    'needs_attention',
    'not_done',
    'not_eaten',
    'pending',
    'pending_guardian',
    'requested',
    'failed',
    'overdue',
    'no_answer',
    'retry_needed',
    'urgent'
  ].some((keyword) => value.includes(keyword))
}

export function isUrgentStatus(status?: string | null) {
  if (!status) return false
  const value = status.toLowerCase()

  return [
    'urgent',
    'emergency',
    'issue',
    'needs_help',
    'failed'
  ].some((keyword) => value.includes(keyword))
}

export function buildCareCaseAggregate(links: CareCaseLinkCandidate[] | CareCaseLink[]) {
  const urgentLinks = links.filter((link) => isUrgentStatus(link.source_status))
  const attentionLinks = links.filter((link) => isAttentionStatus(link.source_status))

  const reassuranceState: CareCaseReassurance =
    urgentLinks.length > 0
      ? '긴급'
      : attentionLinks.length > 0 || links.length === 0
        ? '확인 필요'
        : '안심'

  const priority: CareCasePriority =
    urgentLinks.length > 0
      ? 'urgent'
      : attentionLinks.length > 0
        ? 'high'
        : 'normal'

  const linkedLabels = Array.from(new Set(links.map((link) => labelCaseLinkType(link.link_type)))).slice(0, 6)

  const summaryText =
    links.length > 0
      ? `이 케이스에는 ${linkedLabels.join(', ')} 항목이 연결되어 있습니다. 현재 상태는 ${reassuranceState}입니다.`
      : '아직 연결된 케어 항목이 없습니다. 운영실에서 안심케어 접수, 케어패스포트, 매니저, 식사, 서류 등을 연결해야 합니다.'

  const familyNextActions: string[] = []

  if (reassuranceState === '긴급') {
    familyNextActions.push('긴급 또는 이슈가 있는 항목을 먼저 확인해주세요.')
  }

  if (links.some((link) => link.link_type === 'cost_approval' && isAttentionStatus(link.source_status))) {
    familyNextActions.push('추가비용 승인 요청을 확인해주세요.')
  }

  if (links.some((link) => link.link_type === 'family_task' && isAttentionStatus(link.source_status))) {
    familyNextActions.push('가족 할 일에서 담당자와 완료 여부를 확인해주세요.')
  }

  if (links.some((link) => link.link_type === 'daily_care' && isAttentionStatus(link.source_status))) {
    familyNextActions.push('식사·약·컨디션 확인이 필요합니다.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('오늘은 케이스 진행상황만 확인하면 됩니다.')
  }

  const importantNotes: string[] = []

  if (links.some((link) => link.link_type === 'care_passport')) {
    importantNotes.push('부모님 상태 정보가 케이스에 연결되어 있습니다.')
  }

  if (links.some((link) => link.link_type === 'manager_field')) {
    importantNotes.push('매니저 현장 배정이 연결되어 있습니다.')
  }

  if (links.some((link) => link.link_type === 'summary_30sec')) {
    importantNotes.push('30초 요약 리포트가 연결되어 있습니다.')
  }

  return {
    reassuranceState,
    priority,
    summaryText,
    familyNextActions: Array.from(new Set(familyNextActions)).slice(0, 3),
    importantNotes: Array.from(new Set(importantNotes)).slice(0, 5)
  }
}

export function timelineSeverityFromStatus(status?: string | null): 'info' | 'attention' | 'urgent' {
  if (isUrgentStatus(status)) return 'urgent'
  if (isAttentionStatus(status)) return 'attention'
  return 'info'
}

export function buildTimelineTitleFromLink(link: CareCaseLinkCandidate | CareCaseLink) {
  return `${labelCaseLinkType(link.link_type)} 연결됨`
}

export function buildTimelineDescriptionFromLink(link: CareCaseLinkCandidate | CareCaseLink) {
  const status = link.source_status ? `상태: ${link.source_status}` : '상태 미확인'
  return `${link.source_label} · ${status}`
}

export function buildCaseSummaryFromCases(cases: CareCase[]) {
  const open = cases.filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status))
  const urgent = open.filter((item) => item.reassurance_state === '긴급' || item.priority === 'urgent')
  const attention = open.filter((item) => item.reassurance_state === '확인 필요')
  const completed = cases.filter((item) => item.status === 'completed')

  const reassuranceState: CareCaseReassurance =
    urgent.length > 0
      ? '긴급'
      : attention.length > 0 || open.length > 0
        ? '확인 필요'
        : '안심'

  const familyNextActions: string[] = []

  if (urgent.length > 0) {
    familyNextActions.push('긴급 케이스를 먼저 확인해주세요.')
  }

  if (attention.length > 0) {
    familyNextActions.push('확인 필요한 케이스가 있습니다.')
  }

  if (open.length > 0) {
    familyNextActions.push('진행 중인 부모님 케이스를 확인해주세요.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('지금은 진행 중인 케이스가 없습니다.')
  }

  return {
    reassuranceState,
    total: cases.length,
    open: open.length,
    urgent: urgent.length,
    attention: attention.length,
    completed: completed.length,
    familyNextActions: familyNextActions.slice(0, 3)
  }
}
