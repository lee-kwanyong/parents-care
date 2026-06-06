'use client'

import { useEffect, useMemo, useState } from 'react'

type OutboxItem = {
  id: string
  channel: string
  to_name?: string | null
  to_phone?: string | null
  to_email?: string | null
  title: string
  body: string
  status: string
  provider?: string | null
  reason?: string | null
  created_at?: string
  sent_at?: string | null
}

function statusLabel(status: string) {
  if (status === 'sent') return '발송완료'
  if (status === 'failed') return '실패'
  if (status === 'queued') return '대기'
  if (status === 'outbox-only') return '발송대기'
  return status || '확인필요'
}

function statusClass(status: string) {
  if (status === 'sent') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  if (status === 'failed') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (status === 'outbox-only') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-[#F7FBFF] text-[#234B68] ring-[#DCEDE7]'
}

export function AnbuOutboxPage() {
  const [items, setItems] = useState<OutboxItem[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [showRaw, setShowRaw] = useState(false)

  async function load() {
    setLoading(true)
    const response = await fetch('/api/anbu-notifications/outbox', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))
    setItems(Array.isArray(data.items) ? data.items : [])
    setResult(data)
    setLoading(false)
  }

  async function dispatch() {
    setLoading(true)
    const response = await fetch('/api/anbu-notifications/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 30 })
    })
    const data = await response.json().catch(() => ({}))
    setResult(data)
    await load()
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => {
    return {
      total: items.length,
      sent: items.filter((item) => item.status === 'sent').length,
      failed: items.filter((item) => item.status === 'failed').length,
      queued: items.filter((item) => ['queued', 'outbox-only'].includes(item.status)).length
    }
  }, [items])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-5 py-8 text-[#17443F]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            운영실 · 알림 발송함
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            보호자 알림 발송 상태를 확인합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            부모님 위험 신호, 응답 없음, 복약 확인 필요 알림이 SMS로 발송됩니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-60"
            >
              새로고침
            </button>

            <button
              onClick={dispatch}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              대기/실패 알림 발송
            </button>

            <button
              onClick={() => setShowRaw((value) => !value)}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              {showRaw ? '원본 숨기기' : '원본 보기'}
            </button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="전체" value={summary.total} />
          <SummaryCard label="발송완료" value={summary.sent} />
          <SummaryCard label="발송대기" value={summary.queued} />
          <SummaryCard label="실패" value={summary.failed} />
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">최근 알림</h2>

          <div className="mt-5 grid gap-3">
            {items.length === 0 ? (
              <p className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                표시할 알림이 없습니다.
              </p>
            ) : (
              items.map((item) => (
                <article key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-wrap gap-2">
                    <Badge text={statusLabel(item.status)} className={statusClass(item.status)} />
                    <Badge text={item.channel?.toUpperCase() || '알림'} />
                    {item.provider ? <Badge text={item.provider} /> : null}
                    {item.reason ? <Badge text={item.reason} /> : null}
                  </div>

                  <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{item.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm font-bold leading-7 text-[#637B76]">{item.body}</p>

                  <div className="mt-4 grid gap-2 text-xs font-bold text-[#7A9692] sm:grid-cols-2">
                    <p>수신자: {item.to_name || '-'}</p>
                    <p>휴대폰: {item.to_phone || '-'}</p>
                    <p>생성: {item.created_at ? new Date(item.created_at).toLocaleString('ko-KR') : '-'}</p>
                    <p>발송: {item.sent_at ? new Date(item.sent_at).toLocaleString('ko-KR') : '-'}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {showRaw ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">최근 처리 결과 원본</h2>
            <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7]">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#2AA897]">{value}</div>
    </section>
  )
}

function Badge({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={'rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#DCEDE7] ' + className}>
      {text}
    </span>
  )
}
