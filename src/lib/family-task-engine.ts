export type FamilyTaskCategory =
  | 'meal'
  | 'medication'
  | 'condition'
  | 'safe_return'
  | 'documents'
  | 'appointment'
  | 'care_plan'
  | 'social_support'
  | 'emergency'
  | 'general'

export type FamilyTaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type FamilyTaskStatus = 'pending' | 'claimed' | 'done' | 'delegated' | 'cancelled'

export type FamilyActionItem = {
  id: string
  title: string
  description: string | null
  category: FamilyTaskCategory
  priority: FamilyTaskPriority
  status: FamilyTaskStatus
  assigned_to_name: string | null
  assigned_to_phone: string | null
  source_type: string
  source_id: string | null
  dedupe_key?: string | null
  due_at: string | null
  claimed_at: string | null
  completed_at: string | null
  delegated_at: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export type DailyCareSource = {
  id?: string
  elder_name?: string
  check_type?: string
  care_label?: string
  status?: string
  memo?: string | null
  occurred_at?: string
}

export type PlanSource = {
  intakeId?: string
  title?: string
  primaryActions?: string[]
  familyQuestions?: string[]
  passportSafetyNotes?: string[]
  socialCareNote?: string
}

export function labelTaskCategory(category: string) {
  const map: Record<string, string> = {
    meal: '식사',
    medication: '약',
    condition: '컨디션',
    safe_return: '귀가',
    documents: '서류',
    appointment: '예약',
    care_plan: '케어플랜',
    social_support: '사회공헌',
    emergency: '긴급',
    general: '일반'
  }

  return map[category] || category
}

export function labelTaskStatus(status: string) {
  const map: Record<string, string> = {
    pending: '대기',
    claimed: '담당 중',
    done: '완료',
    delegated: '넘김',
    cancelled: '취소'
  }

  return map[status] || status
}

export function labelTaskPriority(priority: string) {
  const map: Record<string, string> = {
    low: '낮음',
    normal: '보통',
    high: '중요',
    urgent: '긴급'
  }

  return map[priority] || priority
}

function safeDateKey(date?: string | null) {
  const d = date ? new Date(date) : new Date()
  if (!Number.isFinite(d.getTime())) return new Date().toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}

export function buildDailyCareTasks(checkins: DailyCareSource[]) {
  const tasks: Array<{
    title: string
    description: string
    category: FamilyTaskCategory
    priority: FamilyTaskPriority
    source_type: 'daily_care'
    source_id: string | null
    dedupe_key: string
    memo?: string
  }> = []

  for (const item of checkins) {
    const type = item.check_type || 'general'
    const status = item.status || 'unknown'
    const elderName = item.elder_name || '부모님'
    const label = item.care_label || '오늘 확인'
    const dateKey = safeDateKey(item.occurred_at)
    const sourceId = item.id || null

    if (type === 'meal' && status === 'not_done') {
      tasks.push({
        title: `${elderName} 식사 확인하기`,
        description: `${label}을 아직 못 드셨다고 표시되었습니다. 이유를 확인하고 필요하면 안심밥상이나 식사 도움을 연결하세요.`,
        category: 'meal',
        priority: 'high',
        source_type: 'daily_care',
        source_id: sourceId,
        dedupe_key: `daily:${dateKey}:meal:not_done:${elderName}`,
        memo: item.memo || null || undefined
      })
    }

    if (type === 'medication' && status === 'not_done') {
      tasks.push({
        title: `${elderName} 약 복용 확인하기`,
        description: `${label}을 아직 안 드셨다고 표시되었습니다. 복용 여부와 약 봉투를 확인하세요.`,
        category: 'medication',
        priority: 'high',
        source_type: 'daily_care',
        source_id: sourceId,
        dedupe_key: `daily:${dateKey}:medication:not_done:${elderName}`,
        memo: item.memo || null || undefined
      })
    }

    if ((type === 'emergency' || status === 'needs_help') && status !== 'done') {
      tasks.push({
        title: `${elderName} 도움 요청 확인하기`,
        description: '부모님이 도움이 필요하다고 표시했습니다. 가족 또는 운영실이 즉시 확인해야 합니다.',
        category: 'emergency',
        priority: 'urgent',
        source_type: 'daily_care',
        source_id: sourceId,
        dedupe_key: `daily:${dateKey}:emergency:${elderName}`,
        memo: item.memo || null || undefined
      })
    }

    if (type === 'condition' && status === 'needs_help') {
      tasks.push({
        title: `${elderName} 컨디션 확인하기`,
        description: '컨디션 이상 신호가 있습니다. 통증, 어지러움, 식사 여부를 확인하세요.',
        category: 'condition',
        priority: 'high',
        source_type: 'daily_care',
        source_id: sourceId,
        dedupe_key: `daily:${dateKey}:condition:needs_help:${elderName}`,
        memo: item.memo || null || undefined
      })
    }
  }

  return tasks
}

export function buildCarePlanTasks(plan: PlanSource) {
  const tasks: Array<{
    title: string
    description: string
    category: FamilyTaskCategory
    priority: FamilyTaskPriority
    source_type: 'care_plan'
    source_id: string | null
    dedupe_key: string
    memo?: string
  }> = []

  const intakeId = plan.intakeId || 'manual'
  const primaryActions = Array.isArray(plan.primaryActions) ? plan.primaryActions : []
  const questions = Array.isArray(plan.familyQuestions) ? plan.familyQuestions : []

  for (const [index, action] of primaryActions.slice(0, 3).entries()) {
    tasks.push({
      title: action,
      description: plan.title ? `${plan.title}에서 생성된 가족 할 일입니다.` : '케어플랜에서 생성된 가족 할 일입니다.',
      category: inferCategoryFromText(action),
      priority: inferPriorityFromText(action),
      source_type: 'care_plan',
      source_id: isUuid(intakeId) ? intakeId : null,
      dedupe_key: `plan:${intakeId}:action:${index}:${action}`,
      memo: action
    })
  }

  for (const [index, question] of questions.slice(0, 3).entries()) {
    tasks.push({
      title: question,
      description: '운영실이 가족에게 확인해야 하는 질문입니다.',
      category: inferCategoryFromText(question),
      priority: inferPriorityFromText(question),
      source_type: 'care_plan',
      source_id: isUuid(intakeId) ? intakeId : null,
      dedupe_key: `plan:${intakeId}:question:${index}:${question}`,
      memo: question
    })
  }

  if (plan.socialCareNote) {
    tasks.push({
      title: '공공지원·후원 연결 여부 확인하기',
      description: plan.socialCareNote,
      category: 'social_support',
      priority: 'normal',
      source_type: 'care_plan',
      source_id: isUuid(intakeId) ? intakeId : null,
      dedupe_key: `plan:${intakeId}:social-support`,
      memo: plan.socialCareNote
    })
  }

  return tasks
}

export function inferCategoryFromText(text: string): FamilyTaskCategory {
  if (/식사|밥|도시락|반찬|죽|저염|회복식/.test(text)) return 'meal'
  if (/약|복용|처방/.test(text)) return 'medication'
  if (/서류|영수증|보험|처방전|세부내역/.test(text)) return 'documents'
  if (/예약|진료|병원|외래/.test(text)) return 'appointment'
  if (/퇴원|귀가/.test(text)) return 'safe_return'
  if (/공공|후원|복지|비용/.test(text)) return 'social_support'
  if (/긴급|도움|119/.test(text)) return 'emergency'
  return 'care_plan'
}

export function inferPriorityFromText(text: string): FamilyTaskPriority {
  if (/긴급|도움|119|위험/.test(text)) return 'urgent'
  if (/약|식사|밥|퇴원|귀가|알러지|낙상/.test(text)) return 'high'
  return 'normal'
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function buildTaskSummary(items: FamilyActionItem[]) {
  const open = items.filter((item) => item.status !== 'done' && item.status !== 'cancelled')
  const urgent = open.filter((item) => item.priority === 'urgent')
  const high = open.filter((item) => item.priority === 'high')
  const claimed = open.filter((item) => item.status === 'claimed')
  const done = items.filter((item) => item.status === 'done')

  const reassuranceState =
    urgent.length > 0
      ? '긴급'
      : high.length > 0 || open.length > 0
        ? '확인 필요'
        : '안심'

  return {
    reassuranceState,
    total: items.length,
    open: open.length,
    urgent: urgent.length,
    high: high.length,
    claimed: claimed.length,
    done: done.length,
    topActions: open.slice(0, 3)
  }
}
