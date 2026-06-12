'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Item = {
  id: string
  toName: string
  toPhone: string
  title: string
  body: string
  templateCode: string
  reason: string
  status: string
  provider: string
  createdKst: string
  sentKst: string
  candidateReasons: string[]
  shouldCancelUnsafeFailed: boolean
  shouldCancelQueuedTest: boolean
  isPilotOrRealMessage: boolean
  isTestLike: boolean
}

type Run = {
  id: string
  action?: string
  status?: string
  summary?: string
  created_by?: string
  created_at?: string
  metrics?: Record<string, unknown>
}

function toneClass(tone?: string) {
  if (tone === 'safe' || tone === 'sent' || tone === 'ok') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'warning' || tone === 'queued') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'danger' || tone === 'failed') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function MetricCard({ title, value, desc, tone }: { title: string; value: string; desc: string; tone?: string }) {
  return (
    <article className={'rounded-[1.6rem] p-5 shadow-sm ring-1 ' + toneClass(tone)}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + toneClass(status === 'failed' ? 'failed' : status === 'queued' ? 'queued' : status === 'sent' ? 'sent' : 'normal')}>
      {status || '-'}
    </span>
  )
}

export function NotificationSafetyPanel() {
  const [items, setItems] = useState<Item[]>([])
  const [unsafeFailed, setUnsafeFailed] = useState<Item[]>([])
  const [queuedTests, setQueuedTests] = useState<Item[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<'summary' | 'unsafe' | 'real' | 'runs'>('summary')
  const [createdBy, setCreatedBy] = useState('운영실')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const realItems = useMemo(() => {
    return items.filter((item) => item.isPilotOrRealMessage && !item.isTestLike)
  }, [items])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/notification-safety', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '문자 안전 정보를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setItems(Array.isArray(data.items) ? data.items : [])
      setUnsafeFailed(Array.isArray(data.unsafeFailed) ? data.unsafeFailed : [])
      setQueuedTests(Array.isArray(data.queuedTests) ? data.queuedTests : [])
      setRuns(Array.isArray(data.runs) ? data.runs : [])
      setMetrics(data.metrics || {})
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '문자 안전 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/notification-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, createdBy })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            문자 안전정리센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                테스트 문자와
                <br />
                실증 문자를 분리합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                과거 실패 문자, 테스트 문자, 시뮬레이션 문자가 실증 중 다시 발송되지 않도록 정리합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(Number(metrics.unsafeFailed || 0) > 0 ? 'danger' : 'safe')}>
              <div className="text-sm font-black opacity-70">재시도 위험</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{Number(metrics.unsafeFailed || 0)}건</div>
              <div className="mt-2 text-xs font-bold">정리 대상</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            이 화면은 문자를 보내는 화면이 아닙니다. 실수로 과거 실패 문자나 테스트 문자가 재발송되지 않도록 취소 처리하는 안전장치입니다.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              placeholder="처리자"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button onClick={load} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              새로고침
            </button>

            <button onClick={() => post('cancelQueuedTests')} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              대기 테스트 문자 취소
            </button>

            <button onClick={() => post('cancelUnsafeFailed')} disabled={loading} className="rounded-2xl bg-[#B43C3C] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              과거 실패 재시도 금지
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/admin/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              알림 발송센터
            </Link>
            <Link href="/admin/ops/message-automation" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              자동문자
            </Link>
            <Link href="/admin/ops" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 한눈 홈
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="전체 기록" value={`${Number(metrics.total || 0)}건`} desc="최근 2000건 기준" />
          <MetricCard title="발송 대기" value={`${Number(metrics.queued || 0)}건`} desc="발송 전 확인" tone={Number(metrics.queued || 0) > 0 ? 'warning' : 'normal'} />
          <MetricCard title="발송 성공" value={`${Number(metrics.sent || 0)}건`} desc="SOLAPI 성공" tone="safe" />
          <MetricCard title="실패" value={`${Number(metrics.failed || 0)}건`} desc="재시도 주의" tone={Number(metrics.failed || 0) > 0 ? 'danger' : 'normal'} />
          <MetricCard title="취소" value={`${Number(metrics.cancelled || 0)}건`} desc="재시도 제외" />
          <MetricCard title="정리 대상" value={`${Number(metrics.unsafeFailed || 0)}건`} desc="과거/테스트 실패" tone={Number(metrics.unsafeFailed || 0) > 0 ? 'danger' : 'safe'} />
          <MetricCard title="대기 테스트" value={`${Number(metrics.queuedTests || 0)}건`} desc="취소 후보" tone={Number(metrics.queuedTests || 0) > 0 ? 'warning' : 'normal'} />
          <MetricCard title="실증 후보" value={`${Number(metrics.recentReal || 0)}건`} desc="실사용성 알림" tone="safe" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ['summary', '최근 문자'],
              ['unsafe', '정리 대상'],
              ['real', '실증 문자'],
              ['runs', '정리 기록']
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

        {activeTab === 'summary' ? (
          <MessageList title="최근 문자 기록" items={items} empty="최근 문자 기록이 없습니다." />
        ) : null}

        {activeTab === 'unsafe' ? (
          <section className="space-y-5">
            <MessageList title="과거 실패 재시도 금지 대상" items={unsafeFailed} empty="정리할 과거/테스트 실패 문자가 없습니다." />
            <MessageList title="발송 대기 중 테스트 문자" items={queuedTests} empty="취소할 대기 테스트 문자가 없습니다." />
          </section>
        ) : null}

        {activeTab === 'real' ? (
          <MessageList title="실증·실사용 문자 후보" items={realItems} empty="실증 문자 후보가 없습니다." />
        ) : null}

        {activeTab === 'runs' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">정리 기록</h2>

            <div className="mt-5 space-y-3">
              {runs.length ? (
                runs.map((run) => (
                  <article key={run.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + toneClass(run.status === 'ok' ? 'safe' : 'warning')}>
                        {run.status || 'recorded'}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                        {run.action || '-'}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black">{run.summary || '문자 안전정리 실행'}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      대상 {String(run.metrics?.target || 0)} · 성공 {String(run.metrics?.ok || 0)} · 실패 {String(run.metrics?.failed || 0)}
                      <br />
                      {run.created_by || '-'} · {run.created_at || ''}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 정리 기록이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">실증 중 문자 운영 원칙</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ['실패 재시도 금지', '과거 실패 문자는 먼저 취소 처리하고, 실증 문자만 새로 생성합니다.'],
              ['대기열 확인 후 발송', '자동발송을 켜기 전에는 수신번호와 문구를 반드시 확인합니다.'],
              ['테스트와 실사용 분리', 'ops-test, simulation, validation, 더미 번호는 실증 지표에서 제외합니다.']
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-lg font-black">{title}</div>
                <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function MessageList({ title, items, empty }: { title: string; items: Item[]; empty: string }) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-3xl font-black tracking-[-0.06em]">{title}</h2>

      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill status={item.status} />
                    {item.isTestLike ? (
                      <span className="rounded-full bg-[#FFF9EE] px-3 py-1 text-xs font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
                        테스트
                      </span>
                    ) : null}
                    {item.isPilotOrRealMessage ? (
                      <span className="rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                        실증 후보
                      </span>
                    ) : null}
                    {item.candidateReasons?.length ? (
                      <span className="rounded-full bg-[#FFF4F4] px-3 py-1 text-xs font-black text-[#8A3030] ring-1 ring-[#F3C8C8]">
                        정리 후보
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-lg font-black">{item.title || '안부웍스 알림'}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                    {item.toName || '-'} · {item.toPhone || '-'} · {item.createdKst || '-'}
                    <br />
                    template: {item.templateCode || '-'} · reason: {item.reason || '-'} · provider: {item.provider || '-'}
                  </p>

                  {item.candidateReasons?.length ? (
                    <p className="mt-2 text-sm font-black leading-7 text-[#8A3030]">
                      정리 사유: {item.candidateReasons.join(', ')}
                    </p>
                  ) : null}

                  <p className="mt-2 line-clamp-3 text-sm font-bold leading-7 text-[#637B76]">
                    {item.body || '-'}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
            {empty}
          </div>
        )}
      </div>
    </section>
  )
}

export default NotificationSafetyPanel
