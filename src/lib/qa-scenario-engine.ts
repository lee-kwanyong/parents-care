export type QAScenarioType =
  | 'full_journey'
  | 'hospital_day'
  | 'meal'
  | 'medication'
  | 'discharge'
  | 'documents'
  | 'cost_approval'
  | 'manager_verification'
  | 'manager_matching'
  | 'family_share'
  | 'social_support'
  | 'parent_screen'
  | 'ops'

export type QATargetUser = 'guardian' | 'parent' | 'manager' | 'ops' | 'family' | 'all'
export type QAPriority = 'low' | 'normal' | 'high' | 'critical'
export type QARunStatus = 'not_started' | 'running' | 'passed' | 'failed' | 'blocked' | 'needs_fix'
export type QAStepResultStatus = 'pending' | 'passed' | 'failed' | 'blocked' | 'skipped'

export type QAScenario = {
  id: string
  scenario_code: string
  title: string
  description: string
  scenario_type: QAScenarioType
  target_user: QATargetUser
  priority: QAPriority
  status: 'active' | 'paused' | 'archived'
  expected_outcome: string
  pass_criteria: string[]
  created_at: string
  updated_at: string
}

export type QAStep = {
  id: string
  scenario_id: string
  step_order: number
  actor: 'guardian' | 'parent' | 'manager' | 'ops' | 'family' | 'system'
  screen_path: string
  action_label: string
  expected_result: string
  is_required: boolean
  created_at: string
}

export type QARun = {
  id: string
  scenario_id: string
  run_label: string
  environment: 'local' | 'staging' | 'production'
  tester_name: string | null
  run_status: QARunStatus
  summary: string | null
  issue_count: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type QAStepResult = {
  id: string
  qa_run_id: string
  qa_step_id: string
  result_status: QAStepResultStatus
  actual_result: string | null
  issue_note: string | null
  checked_at: string | null
  created_at: string
  updated_at: string
}

export function labelQAScenarioType(type: string) {
  const map: Record<string, string> = {
    full_journey: '전체 흐름',
    hospital_day: '병원 가는 날',
    meal: '식사',
    medication: '복약',
    discharge: '퇴원 후 7일',
    documents: '서류',
    cost_approval: '비용 승인',
    manager_verification: '매니저 검증',
    manager_matching: '매니저 매칭',
    family_share: '가족 공동조회',
    social_support: '사회공헌',
    parent_screen: '부모님 화면',
    ops: '운영실'
  }

  return map[type] || type
}

export function labelQAPriority(priority: string) {
  const map: Record<string, string> = {
    low: '낮음',
    normal: '보통',
    high: '중요',
    critical: '필수'
  }

  return map[priority] || priority
}

export function labelQARunStatus(status: string) {
  const map: Record<string, string> = {
    not_started: '시작 전',
    running: '진행 중',
    passed: '통과',
    failed: '실패',
    blocked: '차단',
    needs_fix: '수정 필요'
  }

  return map[status] || status
}

export function labelQAStepResultStatus(status: string) {
  const map: Record<string, string> = {
    pending: '대기',
    passed: '통과',
    failed: '실패',
    blocked: '차단',
    skipped: '건너뜀'
  }

  return map[status] || status
}

export function buildQASummary(scenarios: QAScenario[], runs: QARun[], results: QAStepResult[]) {
  const latestRunByScenario = new Map<string, QARun>()

  for (const run of runs) {
    const current = latestRunByScenario.get(run.scenario_id)
    if (!current || new Date(run.created_at).getTime() > new Date(current.created_at).getTime()) {
      latestRunByScenario.set(run.scenario_id, run)
    }
  }

  const critical = scenarios.filter((scenario) => scenario.priority === 'critical')
  const passed = Array.from(latestRunByScenario.values()).filter((run) => run.run_status === 'passed')
  const failed = Array.from(latestRunByScenario.values()).filter((run) => run.run_status === 'failed' || run.run_status === 'needs_fix')
  const blocked = Array.from(latestRunByScenario.values()).filter((run) => run.run_status === 'blocked')
  const running = Array.from(latestRunByScenario.values()).filter((run) => run.run_status === 'running')
  const failedResults = results.filter((result) => result.result_status === 'failed')
  const blockedResults = results.filter((result) => result.result_status === 'blocked')

  const reassuranceState =
    blocked.length > 0 || blockedResults.length > 0
      ? '긴급'
      : failed.length > 0 || failedResults.length > 0 || running.length > 0
        ? '확인 필요'
        : scenarios.length > 0 && passed.length >= Math.min(scenarios.length, critical.length || scenarios.length)
          ? '안심'
          : '확인 필요'

  const opsNextActions: string[] = []

  if (blocked.length > 0 || blockedResults.length > 0) {
    opsNextActions.push('차단된 QA 시나리오를 먼저 확인하세요.')
  }

  if (failed.length > 0 || failedResults.length > 0) {
    opsNextActions.push('실패한 단계의 실제 결과와 이슈 메모를 확인하세요.')
  }

  if (running.length > 0) {
    opsNextActions.push('진행 중인 QA Run을 완료하세요.')
  }

  if (opsNextActions.length === 0) {
    opsNextActions.push('핵심 QA 상태가 안정적입니다.')
  }

  return {
    reassuranceState,
    scenarioTotal: scenarios.length,
    criticalTotal: critical.length,
    runTotal: runs.length,
    passedTotal: passed.length,
    failedTotal: failed.length,
    blockedTotal: blocked.length,
    runningTotal: running.length,
    failedStepTotal: failedResults.length,
    blockedStepTotal: blockedResults.length,
    opsNextActions: opsNextActions.slice(0, 4)
  }
}
