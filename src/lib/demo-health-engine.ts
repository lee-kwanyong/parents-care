export type DemoHealthStatus = 'pass' | 'warning' | 'fail'

export type DemoHealthCheck = {
  key: string
  label: string
  group: 'intake' | 'parent' | 'manager' | 'matching' | 'field' | 'report' | 'evaluation' | 'infra'
  status: DemoHealthStatus
  count: number | null
  message: string
  path?: string
}

export type DemoHealthSummary = {
  readinessState: '시연 가능' | '데이터 생성 필요' | '수정 필요'
  total: number
  pass: number
  warning: number
  fail: number
  nextActions: string[]
}

export const demoHealthTargets: Array<{
  key: string
  label: string
  table: string
  group: DemoHealthCheck['group']
  minCount: number
  path: string
  required: boolean
}> = [
  {
    key: 'demo_seed_runs',
    label: '데모 생성 기록',
    table: 'care_demo_seed_runs',
    group: 'infra',
    minCount: 1,
    path: '/demo-start',
    required: false
  },
  {
    key: 'assisted_intake',
    label: '사진·카톡 접수',
    table: 'care_assisted_intake_requests',
    group: 'intake',
    minCount: 1,
    path: '/admin/ops/intake-inbox',
    required: true
  },
  {
    key: 'storage_files',
    label: '파일 메타데이터',
    table: 'care_storage_files',
    group: 'intake',
    minCount: 1,
    path: '/admin/ops/files',
    required: false
  },
  {
    key: 'care_passport',
    label: '부모님 케어패스포트',
    table: 'care_passports',
    group: 'parent',
    minCount: 1,
    path: '/care-passport',
    required: true
  },
  {
    key: 'manager_application',
    label: '매니저 지원서',
    table: 'care_manager_applications',
    group: 'manager',
    minCount: 1,
    path: '/admin/ops/managers',
    required: true
  },
  {
    key: 'manager_verification',
    label: '매니저 본인확인·신분확인',
    table: 'care_manager_identity_verifications',
    group: 'manager',
    minCount: 4,
    path: '/admin/ops/manager-verification',
    required: true
  },
  {
    key: 'manager_profile',
    label: '승인된 매니저 신뢰카드',
    table: 'care_manager_profiles',
    group: 'manager',
    minCount: 1,
    path: '/admin/ops/managers',
    required: true
  },
  {
    key: 'matching_request',
    label: '검증 매니저 매칭 요청',
    table: 'care_manager_matching_requests',
    group: 'matching',
    minCount: 1,
    path: '/admin/ops/manager-matching',
    required: true
  },
  {
    key: 'matching_candidate',
    label: '검증 매니저 후보',
    table: 'care_manager_matching_candidates',
    group: 'matching',
    minCount: 1,
    path: '/admin/ops/manager-matching',
    required: true
  },
  {
    key: 'field_assignment',
    label: '현장 배정',
    table: 'manager_field_assignments',
    group: 'field',
    minCount: 1,
    path: '/admin/ops/manager-field',
    required: true
  },
  {
    key: 'field_checklist',
    label: '현장 체크리스트',
    table: 'manager_field_checklist_items',
    group: 'field',
    minCount: 1,
    path: '/manager/today',
    required: true
  },
  {
    key: 'field_report',
    label: '매니저 리포트 초안',
    table: 'manager_field_reports',
    group: 'report',
    minCount: 1,
    path: '/child/cases',
    required: true
  },
  {
    key: 'manager_evaluation',
    label: '매칭 후 평가',
    table: 'care_manager_evaluations',
    group: 'evaluation',
    minCount: 1,
    path: '/child/manager-evaluations',
    required: true
  },
  {
    key: 'notification_outbox',
    label: '알림 큐',
    table: 'notification_outbox',
    group: 'report',
    minCount: 1,
    path: '/admin/ops/notifications',
    required: false
  }
]

export function buildDemoHealthSummary(checks: DemoHealthCheck[]): DemoHealthSummary {
  const pass = checks.filter((item) => item.status === 'pass').length
  const warning = checks.filter((item) => item.status === 'warning').length
  const fail = checks.filter((item) => item.status === 'fail').length

  const readinessState =
    fail > 0
      ? '수정 필요'
      : warning > 0
        ? '데이터 생성 필요'
        : '시연 가능'

  const nextActions: string[] = []

  if (checks.some((item) => item.status === 'fail')) {
    nextActions.push('실패한 테이블 또는 API를 먼저 확인하세요.')
  }

  if (checks.some((item) => item.status === 'warning' && item.key === 'assisted_intake')) {
    nextActions.push('데모 데이터 생성을 실행해 사진·카톡 접수 데이터를 만드세요.')
  }

  if (checks.some((item) => item.status === 'warning' && item.group === 'manager')) {
    nextActions.push('매니저 지원, 본인확인, 신뢰카드 데이터를 생성하세요.')
  }

  if (checks.some((item) => item.status === 'warning' && item.group === 'matching')) {
    nextActions.push('검증 매니저 매칭 요청과 후보를 생성하세요.')
  }

  if (checks.some((item) => item.status === 'warning' && item.group === 'field')) {
    nextActions.push('현장 배정과 체크리스트를 생성하세요.')
  }

  if (checks.some((item) => item.status === 'warning' && item.group === 'evaluation')) {
    nextActions.push('매칭 후 평가 데이터를 생성하세요.')
  }

  if (nextActions.length === 0) {
    nextActions.push('바이어에게 /buyer-demo 링크를 공유하고 15분 시연을 진행하세요.')
  }

  return {
    readinessState,
    total: checks.length,
    pass,
    warning,
    fail,
    nextActions: nextActions.slice(0, 5)
  }
}
