export type TodayReassuranceState = '안심' | '확인 필요' | '긴급'
export type TodaySourceSeverity = 'info' | 'attention' | 'urgent'

export type TodaySourceType =
  | 'care_case'
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
  | 'communication'
  | 'summary_30sec'
  | 'manager_field'
  | 'cost_approval'

export type TodayCareSource = {
  id: string
  sourceType: TodaySourceType
  label: string
  statusLabel: string
  severity: TodaySourceSeverity
  url: string
  createdAt?: string | null
  memo?: string | null
}

export type TodayReassuranceSummary = {
  reassuranceState: TodayReassuranceState
  summaryText: string
  topReasons: TodayCareSource[]
  familyNextActions: string[]
  importantNotes: string[]
  sourceCounts: Record<string, number>
  sourceCount: number
  urgentCount: number
  attentionCount: number
}

export function labelTodaySourceType(type: string) {
  const map: Record<string, string> = {
    care_case: '통합 케이스',
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
    communication: '연락센터',
    summary_30sec: '30초 요약',
    manager_field: '매니저 현장',
    cost_approval: '비용 승인'
  }

  return map[type] || type
}

function severityWeight(severity: TodaySourceSeverity) {
  if (severity === 'urgent') return 3
  if (severity === 'attention') return 2
  return 1
}

function createdAtTime(value?: string | null) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}

function buildActionForSource(source: TodayCareSource) {
  if (source.sourceType === 'cost_approval') {
    return '추가비용 승인 요청을 확인해주세요.'
  }

  if (source.sourceType === 'family_task') {
    return '가족 할 일에서 담당자와 완료 여부를 확인해주세요.'
  }

  if (source.sourceType === 'daily_care') {
    if (/약|복약|medication/.test(source.label + source.statusLabel)) {
      return '약 복용 여부를 확인해주세요.'
    }

    if (/식사|밥|meal/.test(source.label + source.statusLabel)) {
      return '식사 여부를 확인해주세요.'
    }

    return '부모님 오늘 상태를 확인해주세요.'
  }

  if (source.sourceType === 'meal') {
    return '식사 미확인 또는 식사 도움 필요 여부를 확인해주세요.'
  }

  if (source.sourceType === 'documents') {
    return '서류·영수증 준비 또는 수령 상태를 확인해주세요.'
  }

  if (source.sourceType === 'manager_field') {
    return '매니저 현장 진행상태와 이슈를 확인해주세요.'
  }

  if (source.sourceType === 'discharge') {
    return '퇴원 후 약·식사·통증·다음 외래 상태를 확인해주세요.'
  }

  if (source.sourceType === 'routine' || source.sourceType === 'next_visit') {
    return '다음 예약 또는 정기진료 일정을 확인해주세요.'
  }

  if (source.sourceType === 'assisted_intake' || source.sourceType === 'care_intake') {
    return '운영실이 정리 중인 부모님 안심케어 접수를 확인해주세요.'
  }

  if (source.sourceType === 'social_support') {
    return '공공지원·후원 연결 검토 상태를 확인해주세요.'
  }

  if (source.sourceType === 'communication' || source.sourceType === 'summary_30sec') {
    return '30초 요약 또는 운영실 연락 내용을 확인해주세요.'
  }

  if (source.sourceType === 'care_case') {
    return '진행 중인 부모님 케이스를 확인해주세요.'
  }

  return '확인 필요한 항목을 살펴봐주세요.'
}

export function buildTodayReassuranceSummary(sources: TodayCareSource[]): TodayReassuranceSummary {
  const sorted = [...sources].sort((a, b) => {
    const severityDiff = severityWeight(b.severity) - severityWeight(a.severity)
    if (severityDiff !== 0) return severityDiff
    return createdAtTime(b.createdAt) - createdAtTime(a.createdAt)
  })

  const urgent = sorted.filter((source) => source.severity === 'urgent')
  const attention = sorted.filter((source) => source.severity === 'attention')

  const reassuranceState: TodayReassuranceState =
    urgent.length > 0
      ? '긴급'
      : attention.length > 0
        ? '확인 필요'
        : '안심'

  const topReasons = sorted.filter((source) => source.severity !== 'info').slice(0, 5)

  const sourceCounts: Record<string, number> = {}

  for (const source of sources) {
    sourceCounts[source.sourceType] = (sourceCounts[source.sourceType] || 0) + 1
  }

  const summaryText =
    reassuranceState === '긴급'
      ? `오늘 긴급 확인이 필요한 항목이 ${urgent.length}개 있습니다. 가족 또는 운영실이 바로 확인해야 합니다.`
      : reassuranceState === '확인 필요'
        ? `오늘 확인이 필요한 항목이 ${attention.length}개 있습니다. 가족 할 일과 비용 승인, 식사·약 확인을 먼저 봐주세요.`
        : sources.length > 0
          ? '오늘 큰 문제 없이 안심 상태입니다. 필요한 진행상황만 확인하면 됩니다.'
          : '아직 오늘 확인된 데이터가 없습니다. 부모님 안심케어 접수나 상태 확인을 시작해보세요.'

  const familyNextActions =
    topReasons.length > 0
      ? unique(topReasons.map(buildActionForSource)).slice(0, 3)
      : ['오늘은 추가로 할 일이 없습니다.']

  const importantNotes: string[] = []

  if (sources.some((source) => source.sourceType === 'care_passport')) {
    importantNotes.push('부모님 케어패스포트가 안심판에 반영됩니다.')
  }

  if (sources.some((source) => source.sourceType === 'cost_approval' && source.severity !== 'info')) {
    importantNotes.push('추가비용은 보호자 승인 후에만 진행합니다.')
  }

  if (sources.some((source) => source.sourceType === 'manager_field')) {
    importantNotes.push('매니저 현장 진행상태가 연결되어 있습니다.')
  }

  if (sources.some((source) => source.sourceType === 'summary_30sec')) {
    importantNotes.push('30초 요약 리포트를 확인할 수 있습니다.')
  }

  return {
    reassuranceState,
    summaryText,
    topReasons,
    familyNextActions,
    importantNotes: unique(importantNotes).slice(0, 5),
    sourceCounts,
    sourceCount: sources.length,
    urgentCount: urgent.length,
    attentionCount: attention.length
  }
}
