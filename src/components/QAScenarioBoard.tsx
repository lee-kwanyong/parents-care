'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  buildQASummary,
  labelQAPriority,
  labelQARunStatus,
  labelQAScenarioType,
  labelQAStepResultStatus,
  type QARun,
  type QARunStatus,
  type QAScenario,
  type QAStep,
  type QAStepResult,
  type QAStepResultStatus
} from '@/lib/qa-scenario-engine'

export function QAScenarioBoard() {
  const [scenarios, setScenarios] = useState<QAScenario[]>([])
  const [steps, setSteps] = useState<QAStep[]>([])
  const [runs, setRuns] = useState<QARun[]>([])
  const [results, setResults] = useState<QAStepResult[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/qa-scenarios', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'QA 정보를 불러오지 못했습니다.')
      }

      setScenarios(data.scenarios || [])
      setSteps(data.steps || [])
      setRuns(data.runs || [])
      setResults(data.results || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'QA 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function startRun(scenario: QAScenario) {
    setMessage('')

    try {
      const response = await fetch('/api/qa-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_run',
          scenarioId: scenario.id,
          runLabel: `${scenario.title} 테스트`,
          environment: 'local',
          testerName: '운영실'
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'QA Run 시작 실패')
      }

      setMessage('QA Run을 시작했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'QA Run 시작 실패')
    }
  }

  async function updateRun(id: string, status: QARunStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/qa-scenarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'run',
          id,
          status
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'QA Run 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'QA Run 상태 변경 실패')
    }
  }

  async function updateStepResult(id: string, status: QAStepResultStatus) {
    setMessage('')

    let issueNote = ''
    let actualResult = ''

    if (status === 'failed' || status === 'blocked') {
      issueNote = window.prompt('이슈 메모를 입력해주세요.', '') || ''
    }

    if (status === 'passed') {
      actualResult = '기대 결과대로 동작했습니다.'
    }

    try {
      const response = await fetch('/api/qa-scenarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'step_result',
          id,
          status,
          issueNote,
          actualResult
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'QA Step 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'QA Step 상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildQASummary(scenarios, runs, results), [scenarios, runs, results])

  const stepsByScenario = useMemo(() => {
    const map = new Map<string, QAStep[]>()

    for (const step of steps) {
      const current = map.get(step.scenario_id) || []
      current.push(step)
      map.set(step.scenario_id, current)
    }

    for (const [key, value] of map) {
      map.set(key, value.sort((a, b) => a.step_order - b.step_order))
    }

    return map
  }, [steps])

  const runsByScenario = useMemo(() => {
    const map = new Map<string, QARun[]>()

    for (const run of runs) {
      const current = map.get(run.scenario_id) || []
      current.push(run)
      map.set(run.scenario_id, current)
    }

    return map
  }, [runs])

  const resultsByRun = useMemo(() => {
    const map = new Map<string, QAStepResult[]>()

    for (const result of results) {
      const current = map.get(result.qa_run_id) || []
      current.push(result)
      map.set(result.qa_run_id, current)
    }

    return map
  }, [results])

  const stepMap = useMemo(() => {
    const map = new Map<string, QAStep>()
    for (const step of steps) map.set(step.id, step)
    return map
  }, [steps])

  return (
    <div>
      <section
        className={
          'rounded-3xl p-6 shadow-sm ' +
          (summary.reassuranceState === '긴급'
            ? 'bg-red-50'
            : summary.reassuranceState === '확인 필요'
              ? 'bg-amber-50'
              : 'bg-emerald-50')
        }
      >
        <p className="text-sm font-black text-[#63807C]">QA 안심판</p>
        <h2 className="mt-2 text-5xl font-black">{summary.reassuranceState}</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="시나리오" value={summary.scenarioTotal} />
          <Stat label="필수" value={summary.criticalTotal} />
          <Stat label="Run" value={summary.runTotal} />
          <Stat label="통과" value={summary.passedTotal} />
          <Stat label="실패/차단" value={summary.failedTotal + summary.blockedTotal} />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">운영실이 할 일</h2>
        <div className="mt-4 space-y-3">
          {summary.opsNextActions.map((action, index) => (
            <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {index + 1}. {action}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            QA 시나리오를 불러오는 중...
          </div>
        ) : scenarios.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 QA 시나리오가 없습니다.</div>
            <p className="mt-2 text-[#7A9692]">Supabase SQL을 먼저 실행해주세요.</p>
          </div>
        ) : (
          scenarios.map((scenario) => {
            const scenarioSteps = stepsByScenario.get(scenario.id) || []
            const scenarioRuns = runsByScenario.get(scenario.id) || []
            const latestRun = scenarioRuns[0]
            const latestResults = latestRun ? resultsByRun.get(latestRun.id) || [] : []

            return (
              <article key={scenario.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelQAScenarioType(scenario.scenario_type)} />
                      <Badge text={labelQAPriority(scenario.priority)} />
                      <Badge text={scenario.target_user} />
                      {latestRun ? <Badge text={labelQARunStatus(latestRun.run_status)} /> : <Badge text="테스트 필요" />}
                    </div>

                    <h3 className="mt-3 text-3xl font-black">{scenario.title}</h3>
                    <p className="mt-3 text-base font-bold leading-7 text-[#63807C]">{scenario.description}</p>

                    <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                      <h4 className="font-black text-emerald-950">기대 결과</h4>
                      <p className="mt-2 text-sm font-bold leading-6 text-emerald-900">{scenario.expected_outcome}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(scenario.pass_criteria || []).map((criterion) => (
                        <span key={criterion} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-[#4E6D69]">
                          {criterion}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-w-[180px] gap-2">
                    <button onClick={() => startRun(scenario)} className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]">
                      QA Run 시작
                    </button>
                    {latestRun ? (
                      <>
                        <button onClick={() => updateRun(latestRun.id, 'passed')} className="rounded-2xl bg-[#5F7C92] px-4 py-3 font-black text-[#2E504D]">
                          Run 통과
                        </button>
                        <button onClick={() => updateRun(latestRun.id, 'needs_fix')} className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-900">
                          수정 필요
                        </button>
                        <button onClick={() => updateRun(latestRun.id, 'blocked')} className="rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700">
                          차단
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                <section className="mt-6 rounded-3xl bg-slate-50 p-5">
                  <h4 className="text-xl font-black">테스트 단계</h4>

                  <div className="mt-4 space-y-3">
                    {scenarioSteps.map((step) => {
                      const result = latestResults.find((item) => item.qa_step_id === step.id)

                      return (
                        <div key={step.id} className="rounded-2xl bg-white p-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge text={`${step.step_order}단계`} />
                            <Badge text={step.actor} />
                            {result ? <Badge text={labelQAStepResultStatus(result.result_status)} /> : <Badge text="미실행" />}
                          </div>

                          <div className="mt-3 text-lg font-black">{step.action_label}</div>
                          <p className="mt-2 text-sm leading-6 text-[#63807C]">{step.expected_result}</p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link href={step.screen_path} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black">
                              화면 열기: {step.screen_path}
                            </Link>

                            {result ? (
                              <>
                                <button onClick={() => updateStepResult(result.id, 'passed')} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800">
                                  통과
                                </button>
                                <button onClick={() => updateStepResult(result.id, 'failed')} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-700">
                                  실패
                                </button>
                                <button onClick={() => updateStepResult(result.id, 'blocked')} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-800">
                                  차단
                                </button>
                              </>
                            ) : null}
                          </div>

                          {result?.issue_note ? (
                            <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                              이슈: {result.issue_note}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </section>

                {scenarioRuns.length > 0 ? (
                  <section className="mt-6 rounded-3xl bg-[#5F7C92] p-5 text-[#2E504D]">
                    <h4 className="text-xl font-black">최근 QA Run</h4>
                    <div className="mt-4 space-y-3">
                      {scenarioRuns.slice(0, 3).map((run) => {
                        const runResults = resultsByRun.get(run.id) || []
                        const failed = runResults.filter((result) => result.result_status === 'failed').length
                        const blocked = runResults.filter((result) => result.result_status === 'blocked').length
                        const passed = runResults.filter((result) => result.result_status === 'passed').length

                        return (
                          <div key={run.id} className="rounded-2xl bg-white/70 p-4">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">{labelQARunStatus(run.run_status)}</span>
                              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">통과 {passed}</span>
                              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">실패 {failed}</span>
                              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">차단 {blocked}</span>
                            </div>
                            <div className="mt-2 font-black">{run.run_label}</div>
                            <p className="mt-1 text-xs text-[#7A9692]">{new Date(run.created_at).toLocaleString('ko-KR')}</p>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ) : null}
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#4E6D69]">
      {text}
    </span>
  )
}
