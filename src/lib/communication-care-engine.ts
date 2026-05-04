export type ContactAudience = 'guardian' | 'parent' | 'manager' | 'ops'
export type ContactChannel = 'phone' | 'kakao' | 'app' | 'sms' | 'email'

export type ContactType =
  | 'pre_reassurance_call'
  | 'care_plan_explain'
  | 'report_summary'
  | 'meal_check'
  | 'medication_check'
  | 'discharge_followup'
  | 'document_reminder'
  | 'social_support'
  | 'emergency_callback'
  | 'general'

export type ContactStatus =
  | 'queued'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'no_answer'
  | 'retry_needed'
  | 'failed'
  | 'cancelled'

export type ContactPriority = 'low' | 'normal' | 'high' | 'urgent'

export type SummaryStatus = 'draft' | 'ready' | 'sent' | 'read' | 'archived'
export type ReassuranceState = '안심' | '확인 필요' | '긴급'

export type CareContactTemplate = {
  id: string
  template_code: string
  title: string
  audience: ContactAudience
  channel: ContactChannel
  contact_type: ContactType
  body: string
  easy_summary: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CareContactTask = {
  id: string
  elder_name: string
  guardian_name: string | null
  guardian_phone: string | null
  audience: ContactAudience
  channel: ContactChannel
  contact_type: ContactType
  template_code: string | null
  title: string
  script: string
  status: ContactStatus
  priority: ContactPriority
  scheduled_at: string | null
  completed_at: string | null
  call_result: string | null
  memo: string | null
  ops_memo: string | null
  created_at: string
  updated_at: string
}

export type Care30SecSummary = {
  id: string
  elder_name: string
  source_type: string
  source_id: string | null
  reassurance_state: ReassuranceState
  summary_title: string
  summary_text: string
  family_next_actions: string[]
  important_notes: string[]
  status: SummaryStatus
  sent_at: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

export const contactTypeOptions: Array<{
  code: ContactType
  label: string
  description: string
}> = [
  {
    code: 'pre_reassurance_call',
    label: '사전 안심전화',
    description: '부모님이 낯설지 않도록 미리 안내합니다.'
  },
  {
    code: 'care_plan_explain',
    label: '케어플랜 설명',
    description: '보호자에게 필요한 질문 3개와 할 일 3개를 설명합니다.'
  },
  {
    code: 'report_summary',
    label: '30초 요약 리포트',
    description: '긴 리포트 대신 핵심만 전달합니다.'
  },
  {
    code: 'meal_check',
    label: '식사 확인',
    description: '식사 미확인 또는 도움 요청 시 확인합니다.'
  },
  {
    code: 'medication_check',
    label: '복약 확인',
    description: '약 복용 여부가 불확실할 때 확인합니다.'
  },
  {
    code: 'discharge_followup',
    label: '퇴원 후 확인',
    description: '퇴원 후 7일 안심팩을 안내합니다.'
  },
  {
    code: 'document_reminder',
    label: '서류 안내',
    description: '영수증, 세부내역서, 처방전 등 서류를 안내합니다.'
  },
  {
    code: 'social_support',
    label: '사회공헌 안내',
    description: '공공지원·후원 쿠폰·식사 지원 가능성을 안내합니다.'
  },
  {
    code: 'emergency_callback',
    label: '긴급 콜백',
    description: '도움 요청이나 긴급 상태를 우선 확인합니다.'
  }
]

export function labelContactType(type: string) {
  return contactTypeOptions.find((option) => option.code === type)?.label || type
}

export function labelContactStatus(status: string) {
  const map: Record<string, string> = {
    queued: '대기',
    scheduled: '예약됨',
    in_progress: '진행 중',
    completed: '완료',
    no_answer: '부재중',
    retry_needed: '재연락 필요',
    failed: '실패',
    cancelled: '취소'
  }

  return map[status] || status
}

export function labelChannel(channel: string) {
  const map: Record<string, string> = {
    phone: '전화',
    kakao: '카톡',
    app: '앱',
    sms: '문자',
    email: '이메일'
  }

  return map[channel] || channel
}

export function buildDefaultScript(input: {
  elderName: string
  guardianName?: string
  contactType: ContactType
  reassuranceState?: ReassuranceState
  memo?: string
}) {
  const elderName = input.elderName || '부모님'
  const state = input.reassuranceState || '확인 필요'

  if (input.contactType === 'pre_reassurance_call') {
    return `안녕하세요. ${elderName}님 케어를 도와드릴 담당자입니다. 자녀분이 신청해주셨고, 약속 시간과 만남 암호를 다시 안내드리겠습니다. 천천히 설명드릴게요.`
  }

  if (input.contactType === 'care_plan_explain') {
    return `안녕하세요. ${elderName}님 케어 요청을 확인했습니다. 필요한 질문은 세 가지만 확인드리고, 병원·식사·약·서류 중 필요한 도움을 쉬운 플랜으로 정리해드리겠습니다.`
  }

  if (input.contactType === 'report_summary') {
    return `오늘 ${elderName}님 상태는 ${state}입니다. 핵심 내용과 가족이 할 일만 30초 안에 확인하실 수 있게 정리했습니다.`
  }

  if (input.contactType === 'meal_check') {
    return `${elderName}님 식사 확인이 필요합니다. 식사를 못 드셨거나 도움이 필요하다고 표시되었습니다. 이유를 확인하고 안심밥상 연결 필요 여부를 보겠습니다.`
  }

  if (input.contactType === 'medication_check') {
    return `${elderName}님 약 복용 확인이 필요합니다. 약을 드셨는지, 약 봉투 사진이나 복용 시간을 확인해주세요.`
  }

  if (input.contactType === 'discharge_followup') {
    return `${elderName}님 퇴원 후 확인 연락입니다. 약, 식사, 통증, 다음 외래, 낙상 위험 중 확인이 필요한 항목을 정리하겠습니다.`
  }

  if (input.contactType === 'social_support') {
    return `${elderName}님 케어에서 비용 부담이나 돌봄 공백이 있는지 확인하겠습니다. 공공지원, 후원 쿠폰, 식사 지원 연결 가능성을 운영실이 검토합니다.`
  }

  if (input.contactType === 'emergency_callback') {
    return `${elderName}님 도움 요청이 확인되었습니다. 현재 상황과 위치, 연락 가능 여부를 먼저 확인하겠습니다. 생명·신체 위험이 있으면 즉시 119에 연락해주세요.`
  }

  return input.memo || `${elderName}님 케어 관련 안내 연락입니다. 필요한 내용을 쉽게 정리해드리겠습니다.`
}

export function build30SecSummary(input: {
  elderName: string
  sourceType?: string
  reassuranceState: ReassuranceState
  memo?: string
  familyNextActions?: string[]
  importantNotes?: string[]
}) {
  const elderName = input.elderName || '부모님'
  const state = input.reassuranceState || '확인 필요'

  const defaultText =
    state === '안심'
      ? `${elderName}님 상태는 안심입니다. 현재 큰 문제는 없고, 가족이 확인할 일만 간단히 정리했습니다.`
      : state === '긴급'
        ? `${elderName}님 상태는 긴급 확인이 필요합니다. 가족 또는 운영실이 바로 확인해야 합니다.`
        : `${elderName}님 상태는 확인 필요입니다. 식사, 약, 서류, 다음 일정 중 확인할 항목이 있습니다.`

  const text = input.memo?.trim() || defaultText

  const actions =
    input.familyNextActions && input.familyNextActions.length > 0
      ? input.familyNextActions.slice(0, 3)
      : state === '긴급'
        ? ['부모님께 바로 전화하기', '운영실 확인 요청하기', '위험하면 119 안내']
        : state === '확인 필요'
          ? ['식사·약 확인하기', '가족 할 일 확인하기', '운영실 연락 기다리기']
          : ['추가 확인할 일이 있는지 보기']

  const notes =
    input.importantNotes && input.importantNotes.length > 0
      ? input.importantNotes.slice(0, 5)
      : ['긴 리포트 대신 핵심만 요약했습니다.']

  return {
    summaryTitle: `${elderName} 30초 안심 요약`,
    summaryText: text,
    familyNextActions: actions,
    importantNotes: notes
  }
}

export function buildCommunicationSummary(tasks: CareContactTask[], summaries: Care30SecSummary[]) {
  const openTasks = tasks.filter((task) => !['completed', 'cancelled'].includes(task.status))
  const urgentTasks = openTasks.filter((task) => task.priority === 'urgent')
  const retryTasks = openTasks.filter((task) => ['no_answer', 'retry_needed', 'failed'].includes(task.status))
  const queuedTasks = openTasks.filter((task) => ['queued', 'scheduled'].includes(task.status))

  const readySummaries = summaries.filter((summary) => ['ready', 'sent'].includes(summary.status))
  const urgentSummaries = summaries.filter((summary) => summary.reassurance_state === '긴급' && summary.status !== 'archived')

  const reassuranceState =
    urgentTasks.length > 0 || urgentSummaries.length > 0
      ? '긴급'
      : retryTasks.length > 0 || queuedTasks.length > 0 || readySummaries.length > 0
        ? '확인 필요'
        : '안심'

  const familyNextActions: string[] = []

  if (urgentTasks.length > 0 || urgentSummaries.length > 0) {
    familyNextActions.push('긴급 확인이 필요한 연락 또는 요약이 있습니다.')
  }

  if (retryTasks.length > 0) {
    familyNextActions.push('부재중 또는 재연락이 필요한 연락이 있습니다.')
  }

  if (readySummaries.length > 0) {
    familyNextActions.push('확인할 30초 요약이 있습니다.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('지금은 확인할 연락이나 요약이 없습니다.')
  }

  return {
    reassuranceState,
    taskTotal: tasks.length,
    openTaskTotal: openTasks.length,
    urgentTaskTotal: urgentTasks.length,
    retryTaskTotal: retryTasks.length,
    summaryTotal: summaries.length,
    readySummaryTotal: readySummaries.length,
    familyNextActions: familyNextActions.slice(0, 3)
  }
}
