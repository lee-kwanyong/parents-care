'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type QaItem = {
  itemKey: string
  category: string
  title: string
  description: string
  critical: boolean
  route?: string
  autoCheck?: string
  status: 'pending' | 'done' | 'blocked'
  note?: string
  completedBy?: string
  completedAt?: string
  autoMessage?: string
}

type DemoStep = {
  step: number
  time: string
  title: string
  screen: string
  talk: string
}

type QaData = {
  ok: boolean
  status: 'ready' | 'need_check' | 'almost_ready'
  generatedAt: string
  checklist: QaItem[]
  demoScript: DemoStep[]
  metrics: Record<string, number | boolean>
  runs: Array<Record<string, unknown>>
  config: Record<string, unknown>
}

function statusClass(status?: string) {
  if (status === 'ready' || status === 'done') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (status === 'blocked' || status === 'need_check') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
}

function statusText(status?: string) {
  if (status === 'ready') return '시연 가능'
  if (status === 'almost_ready') return '거의 준비'
  if (status === 'need_check') return '점검 필요'
  if (status === 'done') return '완료'
  if (status === 'blocked') return '차단'
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

function groupByCategory(items: QaItem[]) {
  return items.reduce<Record<string, QaItem[]>>((acc, item) => {
    acc[item.category] = acc[item.category] || []
    acc[item.category].push(item)
    return acc
  }, {})
}

export function PilotQaScriptPanel({
  title = '실증 QA·시연 스크립트',
  subtitle = '지자체 실증 전 필수 점검과 15분 시연 순서를 한 화면에서 관리합니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [data, setData] = useState<QaData | null>(null)
  const [activeTab, setActiveTab] = useState<'checklist' | 'script' | 'history'>('checklist')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [completedBy, setCompletedBy] = useState('운영실')
  const [note, setNote] = useState('')

  const grouped = useMemo(() => groupByCategory(data?.checklist || []), [data])

  const scriptText = useMemo(() => {
    return (data?.demoScript || [])
      .map((step) => `${step.step}. ${step.title} (${step.time})\n화면: ${step.screen}\n멘트: ${step.talk}`)
      .join('\n\n')
  }, [data])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/pilot-qa', { cache: 'no-store' })
      const next = await response.json().catch(() => ({}))

      if (!response.ok || !next.ok) {
        setMessage(next.message || '실증 QA를 불러오지 못했습니다.')
        setDebug(JSON.stringify(next.detail || next, null, 2))
        return
      }

      setData(next)
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '실증 QA를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/pilot-qa', {
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

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(scriptText)
      setMessage('시연 스크립트를 클립보드에 복사했습니다.')
    } catch {
      setMessage('클립보드 복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
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
            실증 QA·발표 리허설
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                {title}
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                {subtitle}
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + statusClass(data?.status)}>
              <div className="text-sm font-black opacity-70">준비 상태</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{statusText(data?.status)}</div>
              <div className="mt-2 text-xs font-bold">점수 {Number(metrics.score || 0)}점</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            지자체 시연 전에는 문자, 보안, 긴급 배치, 상태 머신, 보고서, 제출 패키지를 반드시 한 번 이상 실제 흐름으로 확인하세요.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>

            <button onClick={() => post('seedChecklist')} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              체크리스트 초기화
            </button>

            <button onClick={() => post('saveRunSnapshot')} disabled={loading || !data} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              QA 스냅샷 저장
            </button>

            <button onClick={copyScript} disabled={!data} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              스크립트 복사
            </button>

            <button onClick={() => window.print()} className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              인쇄/PDF
            </button>
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
          <MetricCard title="준비 점수" value={`${Number(metrics.score || 0)}점`} desc="전체 완료율" danger={Number(metrics.score || 0) < 80} />
          <MetricCard title="전체 항목" value={`${Number(metrics.total || 0)}개`} desc="QA 항목" />
          <MetricCard title="완료" value={`${Number(metrics.done || 0)}개`} desc="확인 완료" />
          <MetricCard title="대기" value={`${Number(metrics.pending || 0)}개`} desc="점검 필요" danger={Number(metrics.pending || 0) > 0} />
          <MetricCard title="차단" value={`${Number(metrics.blocked || 0)}개`} desc="환경/오류" danger={Number(metrics.blocked || 0) > 0} />
          <MetricCard title="필수" value={`${Number(metrics.criticalTotal || 0)}개`} desc="핵심 항목" />
          <MetricCard title="필수 미완료" value={`${Number(metrics.criticalPending || 0)}개`} desc="시연 전 처리" danger={Number(metrics.criticalPending || 0) > 0} />
          <MetricCard title="저장 기록" value={`${data?.runs?.length || 0}건`} desc="QA 스냅샷" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ['checklist', '체크리스트'],
              ['script', '15분 시연 스크립트'],
              ['history', 'QA 저장 기록']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={
                  'rounded-2xl px-5 py-4 text-sm font-black ring-1 ' +
                  (activeTab === key
                    ? 'bg-[#247A71] text-white ring-[#247A71]'
                    : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'checklist' && data ? (
          <section className="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
            <section className="space-y-5">
              {Object.entries(grouped).map(([category, items]) => (
                <section key={category} className="overflow-hidden rounded-[2rem] bg-white/95 shadow-sm ring-1 ring-[#D6EDE7]">
                  <div className="border-b border-[#D6EDE7] px-5 py-4">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">{category}</h2>
                    <p className="mt-1 text-sm font-bold text-[#637B76]">{items.length}개 항목</p>
                  </div>

                  <div className="divide-y divide-[#D6EDE7]">
                    {items.map((item) => (
                      <article key={item.itemKey} className="p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
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
                                  권장
                                </span>
                              )}
                            </div>

                            <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.title}</h3>
                            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{item.description}</p>
                            {item.autoMessage ? (
                              <p className="mt-1 text-xs font-black text-[#2AA897]">{item.autoMessage}</p>
                            ) : null}
                            {item.note ? (
                              <p className="mt-1 text-xs font-bold text-[#637B76]">메모: {item.note}</p>
                            ) : null}
                          </div>

                          <div className="grid min-w-40 gap-2">
                            {item.route ? (
                              <Link
                                href={item.route}
                                className="rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                              >
                                화면 열기
                              </Link>
                            ) : null}

                            <button
                              onClick={() => post('updateItem', { itemKey: item.itemKey, status: 'done', note, completedBy })}
                              disabled={loading}
                              className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                            >
                              완료
                            </button>

                            <button
                              onClick={() => post('updateItem', { itemKey: item.itemKey, status: 'blocked', note, completedBy })}
                              disabled={loading}
                              className="rounded-xl bg-[#FFF4F4] px-4 py-3 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8] disabled:opacity-50"
                            >
                              차단
                            </button>

                            <button
                              onClick={() => post('updateItem', { itemKey: item.itemKey, status: 'pending', note, completedBy })}
                              disabled={loading}
                              className="rounded-xl bg-[#FAFFFD] px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
                            >
                              대기
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">점검 메모</h2>

              <div className="mt-5 grid gap-3">
                <input
                  value={completedBy}
                  onChange={(event) => setCompletedBy(event.target.value)}
                  placeholder="확인자"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="공통 메모를 입력하면 완료/차단 처리 시 함께 저장됩니다."
                  className="min-h-28 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />
              </div>

              <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                추천 기준:
                <br />
                필수 미완료 0개, 전체 점수 80점 이상이면 지자체 시연 가능 상태로 봅니다.
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'script' && data ? (
          <section className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">15분 지자체 시연 스크립트</h2>

              <div className="mt-5 space-y-3">
                {data.demoScript.map((step) => (
                  <article key={step.step} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                        {step.step}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                        {step.time}
                      </span>
                      <Link href={step.screen} className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                        화면 열기
                      </Link>
                    </div>

                    <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{step.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{step.talk}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">발표 핵심 문장</h2>

                <div className="mt-5 space-y-3 text-sm font-bold leading-7 text-[#637B76]">
                  <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    안부웍스는 119를 대체하지 않고, 응급 전 단계의 생활위험 신호를 보호자·운영실·지역 도움망이 빠르게 확인하도록 연결합니다.
                  </div>
                  <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    부모님의 작은 신호를 사건으로 만들고, 문자·수락·방문·완료 기록을 타임라인과 지자체 보고서로 남깁니다.
                  </div>
                  <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    실증 후에는 대상자 현황, 사건 이력, 알림 기록, 개인정보 감사, 동의 기록을 제출 패키지로 제공합니다.
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">시연 바로가기</h2>

                <div className="mt-5 grid gap-3">
                  <Link href="/proposal" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">외부 제안 페이지</Link>
                  <Link href="/admin/ops/control-center" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">운영실 상태판</Link>
                  <Link href="/admin/ops/urgent-dispatch" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">즉시 배치센터</Link>
                  <Link href="/admin/ops/security-center" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">권한 점검센터</Link>
                  <Link href="/gov/submission-package" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">제출 패키지</Link>
                </div>
              </section>
            </section>
          </section>
        ) : null}

        {activeTab === 'history' && data ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">QA 저장 기록</h2>

            <div className="mt-5 space-y-3">
              {data.runs.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 저장된 QA 스냅샷이 없습니다.
                </div>
              ) : (
                data.runs.map((run, index) => (
                  <article key={String(run.id || index)} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#2AA897]">{String(run.run_type || 'qa')}</div>
                    <h3 className="mt-2 text-lg font-black tracking-[-0.04em]">
                      {String(run.status || '-')} · {String(run.score || 0)}점
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{String(run.summary || '-')}</p>
                    <p className="mt-1 text-xs font-bold text-[#637B76]">{String(run.created_at || '')}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default PilotQaScriptPanel
