'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type TestStatus = 'pass' | 'warn' | 'fail' | 'skip'

type TestResult = {
  key: string
  group: string
  title: string
  status: TestStatus
  message: string
  durationMs: number
  detail?: unknown
  critical?: boolean
}

type RunRow = {
  id: string
  run_type?: string
  status?: string
  score?: number
  summary?: string
  metrics?: Record<string, unknown>
  results?: TestResult[]
  cleanup_results?: unknown[]
  created_by?: string
  created_at?: string
}

function statusClass(status?: string) {
  if (status === 'pass') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (status === 'warn') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (status === 'fail') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (status === 'skip') return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
  return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
}

function statusText(status?: string) {
  if (status === 'pass') return '통과'
  if (status === 'warn') return '주의'
  if (status === 'fail') return '실패'
  if (status === 'skip') return '건너뜀'
  return '대기'
}

function MetricCard({ title, value, desc, danger }: { title: string; value: string; desc: string; danger?: boolean }) {
  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + (danger ? 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]' : 'bg-white text-[#17443F] ring-[#D6EDE7]')}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function groupResults(results: TestResult[]) {
  return results.reduce<Record<string, TestResult[]>>((acc, item) => {
    acc[item.group] = acc[item.group] || []
    acc[item.group].push(item)
    return acc
  }, {})
}

export function PreflightTestPanel() {
  const [runs, setRuns] = useState<RunRow[]>([])
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [currentRun, setCurrentRun] = useState<RunRow | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [cleanup, setCleanup] = useState(true)
  const [createdBy, setCreatedBy] = useState('운영실')

  const results = currentRun?.results || []
  const metrics = currentRun?.metrics || {}

  const grouped = useMemo(() => groupResults(results), [results])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/preflight-test', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '테스트 기록을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setRuns(Array.isArray(data.runs) ? data.runs : [])
      setConfig(data.config || {})

      if (!currentRun && data.runs?.[0]) {
        setCurrentRun(data.runs[0])
      }

      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '테스트 기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function runTest() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/preflight-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'runFullPreflight', cleanup, createdBy })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '전체 기능 테스트 실행에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        await load()
        return
      }

      setCurrentRun({
        id: data.run?.id || 'current',
        status: data.status,
        score: data.score,
        summary: data.summary,
        metrics: data.metrics,
        results: data.results,
        cleanup_results: data.cleanupResults,
        created_by: createdBy,
        created_at: data.generatedAt
      })

      setMessage(data.summary || '전체 기능 테스트가 완료되었습니다.')
      setDebug(JSON.stringify(data, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '전체 기능 테스트 실행 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            실증 전 전체 기능 테스트
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                실증 전에
                <br />
                모든 핵심 흐름을 자동 테스트합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                모바일 앱, 부모님 신호, 운영실 API, 보안센터, 상태 머신, 요양보호사 즉시 배치, 1회용 토큰 수락, 완료 처리까지 한 번에 점검합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + statusClass(currentRun?.status)}>
              <div className="text-sm font-black opacity-70">최근 결과</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{statusText(currentRun?.status)}</div>
              <div className="mt-2 text-xs font-bold">점수 {Number(currentRun?.score || 0)}점</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            실제 119 호출이나 실제 문자 발송은 자동 테스트에서 실행하지 않습니다. 문자 기능은 대기열 생성까지만 검증하고, 실제 발송은 알림 발송센터에서 1건만 수동 테스트하세요.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              placeholder="테스트 실행자"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <label className="flex items-center justify-center gap-2 rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              <input
                type="checkbox"
                checked={cleanup}
                onChange={(event) => setCleanup(event.target.checked)}
              />
              테스트 데이터 자동 정리
            </label>

            <button
              onClick={runTest}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              전체 기능 테스트 실행
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              기록 새로고침
            </button>

            <Link href="/admin/ops/control-center" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 상태판
            </Link>

            <Link href="/admin/ops/security-center" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              권한 점검센터
            </Link>

            <Link href="/mobile" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              모바일 앱
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
              <summary className="cursor-pointer text-sm font-black">전체 JSON 결과 보기</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="전체" value={`${Number(metrics.total || 0)}개`} desc="테스트 항목" />
          <MetricCard title="통과" value={`${Number(metrics.pass || 0)}개`} desc="정상" />
          <MetricCard title="주의" value={`${Number(metrics.warn || 0)}개`} desc="확인 필요" danger={Number(metrics.warn || 0) > 0} />
          <MetricCard title="실패" value={`${Number(metrics.fail || 0)}개`} desc="수정 필요" danger={Number(metrics.fail || 0) > 0} />
          <MetricCard title="건너뜀" value={`${Number(metrics.skip || 0)}개`} desc="선행 실패" />
          <MetricCard title="필수 실패" value={`${Number(metrics.criticalFail || 0)}개`} desc="실증 불가" danger={Number(metrics.criticalFail || 0) > 0} />
          <MetricCard title="필수 주의" value={`${Number(metrics.criticalWarn || 0)}개`} desc="실증 전 확인" danger={Number(metrics.criticalWarn || 0) > 0} />
          <MetricCard title="점수" value={`${Number(metrics.score || 0)}점`} desc="통과율" danger={Number(metrics.score || 0) < 80} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
          <section className="space-y-5">
            {Object.keys(grouped).length === 0 ? (
              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">테스트 결과</h2>
                <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 실행된 테스트가 없습니다. 전체 기능 테스트 실행을 눌러주세요.
                </div>
              </section>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <section key={group} className="overflow-hidden rounded-[2rem] bg-white/95 shadow-sm ring-1 ring-[#D6EDE7]">
                  <div className="border-b border-[#D6EDE7] px-5 py-4">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">{group}</h2>
                    <p className="mt-1 text-sm font-bold text-[#637B76]">{items.length}개 테스트</p>
                  </div>

                  <div className="divide-y divide-[#D6EDE7]">
                    {items.map((item) => (
                      <article key={item.key} className="p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(item.status)}>
                                {statusText(item.status)}
                              </span>
                              {item.critical ? (
                                <span className="rounded-full bg-[#FFF4F4] px-3 py-1 text-xs font-black text-[#8A3030] ring-1 ring-[#F3C8C8]">
                                  필수
                                </span>
                              ) : (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                                  일반
                                </span>
                              )}
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                                {item.durationMs}ms
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.title}</h3>
                            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{item.message}</p>
                          </div>

                          {item.detail ? (
                            <details className="lg:min-w-80">
                              <summary className="cursor-pointer rounded-xl bg-[#FAFFFD] px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                                상세
                              </summary>
                              <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
                                {JSON.stringify(item.detail, null, 2)}
                              </pre>
                            </details>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </section>

          <section className="space-y-5">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">환경 상태</h2>

              <div className="mt-5 space-y-3">
                {Object.entries(config).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAFFFD] px-4 py-3 text-sm font-black ring-1 ring-[#D6EDE7]">
                    <span className="text-[#637B76]">{key}</span>
                    <span>{value ? '설정됨' : '미설정'}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">최근 테스트 기록</h2>

              <div className="mt-5 space-y-3">
                {runs.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                    저장된 테스트 기록이 없습니다.
                  </div>
                ) : (
                  runs.slice(0, 12).map((run) => (
                    <button
                      key={run.id}
                      onClick={() => setCurrentRun(run)}
                      className="w-full rounded-2xl bg-[#FAFFFD] p-4 text-left ring-1 ring-[#D6EDE7]"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(run.status)}>
                          {statusText(run.status)}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                          {run.score || 0}점
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-black">{run.summary || '테스트 기록'}</h3>
                      <p className="mt-2 text-xs font-bold text-[#637B76]">{run.created_by || '-'} · {run.created_at || ''}</p>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              실증 PASS 기준:
              <br />
              필수 실패 0개, 전체 실패 0개, 점수 80점 이상.
              <br />
              주의 항목은 실증 전 메모로 남기고 담당자가 확인해야 합니다.
            </section>
          </section>
        </section>
      </section>
    </main>
  )
}

export default PreflightTestPanel
