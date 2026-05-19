export type OpsSignalCategory = 'urgent' | 'attention' | 'in_progress' | 'completed'

export type OpsSignalSourceType =
  | 'care_case'
  | 'care_intake'
  | 'assisted_intake'
  | 'daily_care'
  | 'family_task'
  | 'documents'
  | 'routine'
  | 'next_visit'
  | 'discharge'
  | 'meal'
  | 'social_support'
  | 'communication'
  | 'summary_30sec'
  | 'manager_field'
  | 'cost_approval'

export type OpsCommandSignal = {
  id: string
  sourceType: OpsSignalSourceType
  title: string
  description?: string | null
  statusLabel: string
  category: OpsSignalCategory
  priority: 'low' | 'normal' | 'high' | 'urgent'
  url: string
  createdAt?: string | null
}

export type OpsCommandSummary = {
  reassuranceState: '안심' | '확인 필요' | '긴급'
  summaryText: string
  totalCount: number
  urgentCount: number
  attentionCount: number
  inProgressCount: number
  completedCount: number
  opsNextActions: string[]
  topSignals: OpsCommandSignal[]
  sourceCounts: Record<string, number>
}

export function labelOpsSourceType(type: string) {
  const map: Record<string, string> = {
    care_case: '통합 케이스',
    care_intake: '안심케어 접수',
    assisted_intake: '사진·카톡 접수',
    daily_care: '밥·약·컨디션',
    family_task: '가족 할 일',
    documents: '서류·영수증',
    routine: '정기진료',
    next_visit: '다음 예약',
    discharge: '퇴원 후 7일',
    meal: '안심밥상',
    social_support: '사회공헌',
    communication: '연락센터',
    summary_30sec: '30초 요약',
    manager_field: '매니저 현장',
    cost_approval: '비용 승인'
  }

  return map[type] || type
}

export function labelOpsCategory(category: string) {
  const map: Record<string, string> = {
    urgent: '긴급',
    attention: '확인 필요',
    in_progress: '진행 중',
    completed: '완료'
  }

  return map[category] || category
}

function categoryWeight(category: OpsSignalCategory) {
  if (category === 'urgent') return 4
  if (category === 'attention') return 3
  if (category === 'in_progress') return 2
  return 1
}

function createdAtTime(value?: string | null) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

export function inferOpsSignalCategory(input: {
  priority?: unknown
  status?: unknown
  reassuranceState?: unknown
}): OpsSignalCategory {
  const priority = String(input.priority || '').toLowerCase()
  const status = String(input.status || '').toLowerCase()
  const reassurance = String(input.reassuranceState || '')

  if (
    priority === 'urgent' ||
    reassurance === '긴급' ||
    status.includes('urgent') ||
    status.includes('긴급') ||
    status.includes('issue') ||
    status.includes('needs_help') ||
    status.includes('failed') ||
    status.includes('emergency')
  ) {
    return 'urgent'
  }

  if (
    reassurance === '확인 필요' ||
    priority === 'high' ||
    status.includes('pending') ||
    status.includes('requested') ||
    status.includes('received') ||
    status.includes('needs_more_info') ||
    status.includes('needs_attention') ||
    status.includes('not_done') ||
    status.includes('not_eaten') ||
    status.includes('overdue') ||
    status.includes('no_answer') ||
    status.includes('retry') ||
    status.includes('draft') ||
    status.includes('reviewing') ||
    status.includes('ready') ||
    status.includes('approved') ||
    status.includes('payment_pending')
  ) {
    return 'attention'
  }

  if (
    status.includes('completed') ||
    status.includes('done') ||
    status.includes('paid') ||
    status.includes('closed') ||
    status.includes('archived') ||
    status.includes('cancelled') ||
    status.includes('resolved') ||
    status.includes('booked') ||
    status.includes('sent') ||
    status.includes('read')
  ) {
    return 'completed'
  }

  return 'in_progress'
}

function buildAction(signal: OpsCommandSignal) {
  if (signal.category === 'urgent') {
    return `${labelOpsSourceType(signal.sourceType)} 긴급 항목을 먼저 확인하세요.`
  }

  if (signal.sourceType === 'cost_approval') {
    return '보호자 추가비용 승인 상태를 확인하세요.'
  }

  if (signal.sourceType === 'manager_field') {
    return '매니저 현장 진행상태와 이슈를 확인하세요.'
  }

  if (signal.sourceType === 'assisted_intake') {
    return '사진·카톡 접수를 케어 요청으로 변환하세요.'
  }

  if (signal.sourceType === 'care_intake') {
    return '안심케어 접수를 케어플랜으로 정리하세요.'
  }

  if (signal.sourceType === 'family_task') {
    return '가족 할 일 담당자와 완료 상태를 확인하세요.'
  }

  if (signal.sourceType === 'meal' || signal.sourceType === 'daily_care') {
    return '식사·약·컨디션 미확인 항목을 확인하세요.'
  }

  if (signal.sourceType === 'documents') {
    return '서류·영수증 준비와 가족 전달 상태를 확인하세요.'
  }

  if (signal.sourceType === 'discharge') {
    return '퇴원 후 7일 체크 중 주의 항목을 확인하세요.'
  }

  if (signal.sourceType === 'social_support') {
    return '사회공헌·공공지원 검토 상태를 확인하세요.'
  }

  return `${labelOpsSourceType(signal.sourceType)} 진행상태를 확인하세요.`
}

export function buildOpsCommandSummary(signals: OpsCommandSignal[]): OpsCommandSummary {
  const sorted = [...signals].sort((a, b) => {
    const categoryDiff = categoryWeight(b.category) - categoryWeight(a.category)
    if (categoryDiff !== 0) return categoryDiff
    return createdAtTime(b.createdAt) - createdAtTime(a.createdAt)
  })

  const urgent = sorted.filter((signal) => signal.category === 'urgent')
  const attention = sorted.filter((signal) => signal.category === 'attention')
  const inProgress = sorted.filter((signal) => signal.category === 'in_progress')
  const completed = sorted.filter((signal) => signal.category === 'completed')

  const reassuranceState =
    urgent.length > 0
      ? '긴급'
      : attention.length > 0 || inProgress.length > 0
        ? '확인 필요'
        : '안심'

  const sourceCounts: Record<string, number> = {}

  for (const signal of signals) {
    sourceCounts[signal.sourceType] = (sourceCounts[signal.sourceType] || 0) + 1
  }

  const topSignals = sorted.filter((signal) => signal.category !== 'completed').slice(0, 8)

  const opsNextActions =
    topSignals.length > 0
      ? Array.from(new Set(topSignals.map(buildAction))).slice(0, 5)
      : ['지금은 우선 처리할 운영 항목이 없습니다.']

  const summaryText =
    reassuranceState === '긴급'
      ? `긴급 항목 ${urgent.length}개가 있습니다. 운영실이 즉시 확인해야 합니다.`
      : reassuranceState === '확인 필요'
        ? `확인 필요 ${attention.length}개, 진행 중 ${inProgress.length}개가 있습니다. 우선순위대로 처리하세요.`
        : '현재 운영실 우선 처리 항목은 없습니다.'

  return {
    reassuranceState,
    summaryText,
    totalCount: signals.length,
    urgentCount: urgent.length,
    attentionCount: attention.length,
    inProgressCount: inProgress.length,
    completedCount: completed.length,
    opsNextActions,
    topSignals,
    sourceCounts
  }
}
