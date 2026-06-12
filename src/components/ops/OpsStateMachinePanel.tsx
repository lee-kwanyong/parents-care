'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Violation = {
  key: string
  type: string
  severity: 'warning' | 'critical'
  requestId?: string
  matchId?: string
  title: string
  message: string
  fixAction: string
  payload?: Record<string, unknown>
}

type StateMachineData = {
  ok: boolean
  status: 'ok' | 'warning' | 'critical'
  generatedAt: string
  rules: {
    requestStatuses: string[]
    terminalRequestStatuses: string[]
    allowedTransitions: Record<string, string[]>
  }
  metrics: Record<string, number>
  violations: Violation[]
  requests: Array<Record<string, unknown>>
  matches: Array<Record<string, unknown>>
  runs: Array<Record<string, unknown>>
  transitions: Array<Record<string, unknown>>
}

function statusClass(status?: string) {
  if (status === 'ok') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (status === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (status === 'critical') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
}

function statusText(status?: string) {
  if (status === 'ok') return '정상'
  if (status === 'warning') return '주의'
  if (status === 'critical') return '긴급'
  return '확인'
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

function format(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

export function OpsStateMachinePanel() {
  const [data, setData] = useState<StateMachineData | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const [transitionForm, setTransitionForm] = useState({
    requestId: '',
    toStatus: 'manual_needed',
    reason: '운영실 수동 상태 전환'
  })

  const groupedViolations = useMemo(() => {
    const map: Record<string, Violation[]> = {}

    for (const violation of data?.violations || []) {
      map[violation.type] = map[violation.type] || []
      map[violation.type].push(violation)
    }

    return map
  }, [data])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ops-state-machine', { cache: 'no-store' })
      const next = await response.json().catch(() => ({}))

      if (!response.ok || !next.ok) {
        setMessage(next.message || '상태 머신 데이터를 불러오지 못했습니다.')
        setDebug(JSON.stringify(next.detail || next, null, 2))
        return
      }

      setData(next)
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 머신 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ops-state-machine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        setMessage(result.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '처리되었습니다.')
      setDebug(JSON.stringify(result, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const metrics = data?.metrics || {}

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            긴급 사건 상태 머신
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                긴급 사건이
                <br />
                안전한 순서로만 처리됩니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                중복 수락, 완료 후 재배치, 만료된 수락 링크, 10분 이상 미수락 긴급 사건을 자동으로 찾아 정리합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + statusClass(data?.status)}>
              <div className="text-sm font-black opacity-70">상태 머신</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{statusText(data?.status)}</div>
              <div className="mt-2 text-xs font-bold">{data?.generatedAt || '조회 전'}</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            안부웍스는 119를 대체하지 않습니다. 이 상태 머신은 생활위험 확인과 지역 도움망 연결의 기록 순서를 안전하게 관리하기 위한 장치입니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>

            <button onClick={() => post('runAllFixes')} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              자동 정리 실행
            </button>

            <button onClick={() => post('saveAuditSnapshot')} disabled={loading || !data} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              점검 스냅샷 저장
            </button>

            <Link href="/admin/ops/control-center" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 상태판
            </Link>

            <Link href="/admin/ops/urgent-dispatch" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              즉시 배치센터
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="전체 사건" value={`${metrics.requests || 0}건`} desc="점검 대상" />
          <MetricCard title="위반" value={`${metrics.violations || 0}건`} desc="정리 필요" danger={Number(metrics.violations || 0) > 0} />
          <MetricCard title="긴급" value={`${metrics.critical || 0}건`} desc="즉시 정리" danger={Number(metrics.critical || 0) > 0} />
          <MetricCard title="주의" value={`${metrics.warning || 0}건`} desc="확인 필요" danger={Number(metrics.warning || 0) > 0} />
          <MetricCard title="열림" value={`${metrics.open || 0}건`} desc="open" />
          <MetricCard title="배치됨" value={`${metrics.dispatched || 0}건`} desc="dispatched" />
          <MetricCard title="수락됨" value={`${metrics.accepted || 0}건`} desc="accepted" />
          <MetricCard title="완료" value={`${metrics.completed || 0}건`} desc="completed" />
        </section>

        {data ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">허용 상태 흐름</h2>

            <div className="mt-5 overflow-x-auto">
              <div className="flex min-w-max items-center gap-3">
                {['open', 'dispatched', 'accepted', 'in_progress', 'completed'].map((status, index, arr) => (
                  <div key={status} className="flex items-center gap-3">
                    <div className="rounded-full bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                      {status}
                    </div>
                    {index < arr.length - 1 ? <div className="text-2xl font-black text-[#247A71]/40">→</div> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['manual_needed', 'cancelled', 'expired'].map((status) => (
                <span key={status} className="rounded-full bg-[#FFF9EE] px-4 py-2 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
                  예외/종료: {status}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {data ? (
          <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">상태 위반 목록</h2>

              <div className="mt-5 space-y-4">
                {data.violations.length === 0 ? (
                  <div className="rounded-2xl bg-[#EFFFFA] p-5 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                    상태 머신 위반이 없습니다.
                  </div>
                ) : (
                  Object.entries(groupedViolations).map(([type, items]) => (
                    <section key={type} className="overflow-hidden rounded-3xl bg-[#FAFFFD] ring-1 ring-[#D6EDE7]">
                      <div className="border-b border-[#D6EDE7] px-5 py-4">
                        <h3 className="text-lg font-black tracking-[-0.04em]">{type}</h3>
                        <p className="mt-1 text-xs font-bold text-[#637B76]">{items.length}건</p>
                      </div>

                      <div className="divide-y divide-[#D6EDE7]">
                        {items.map((violation) => (
                          <article key={violation.key} className="p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap gap-2">
                                  <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(violation.severity)}>
                                    {statusText(violation.severity)}
                                  </span>
                                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                                    {violation.fixAction}
                                  </span>
                                </div>

                                <h4 className="mt-3 text-xl font-black tracking-[-0.05em]">{violation.title}</h4>
                                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{violation.message}</p>
                                <p className="mt-1 text-xs font-bold text-[#637B76]">
                                  requestId: {violation.requestId || '-'} · matchId: {violation.matchId || '-'}
                                </p>
                              </div>

                              <button
                                onClick={() => post(violation.fixAction)}
                                disabled={loading || violation.fixAction === 'manual_review'}
                                className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                              >
                                이 유형 정리
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-5">
              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">개별 상태 전환</h2>

                <div className="mt-5 grid gap-3">
                  <input
                    value={transitionForm.requestId}
                    onChange={(event) => setTransitionForm({ ...transitionForm, requestId: event.target.value })}
                    placeholder="requestId"
                    className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                  />

                  <select
                    value={transitionForm.toStatus}
                    onChange={(event) => setTransitionForm({ ...transitionForm, toStatus: event.target.value })}
                    className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                  >
                    {data.rules.requestStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <textarea
                    value={transitionForm.reason}
                    onChange={(event) => setTransitionForm({ ...transitionForm, reason: event.target.value })}
                    className="min-h-20 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                  />

                  <button
                    onClick={() => post('transitionRequest', transitionForm)}
                    disabled={loading || !transitionForm.requestId}
                    className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                  >
                    허용 전환 실행
                  </button>
                </div>
              </section>

              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">최근 상태 변경 로그</h2>

                <div className="mt-5 space-y-3">
                  {data.transitions.length === 0 ? (
                    <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                      아직 상태 변경 로그가 없습니다.
                    </div>
                  ) : (
                    data.transitions.slice(0, 15).map((row, index) => (
                      <article key={String(row.id || index)} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                        <div className="text-xs font-black text-[#2AA897]">{format(row.transition_type)}</div>
                        <h3 className="mt-2 text-lg font-black tracking-[-0.04em]">
                          {format(row.from_status)} → {format(row.to_status)}
                        </h3>
                        <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{format(row.reason)}</p>
                        <p className="mt-1 text-xs font-bold text-[#637B76]">{format(row.created_at)}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </section>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default OpsStateMachinePanel
