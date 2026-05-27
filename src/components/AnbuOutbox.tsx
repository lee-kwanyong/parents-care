'use client'

import { useEffect, useState } from 'react'

type OutboxItem = {
  id: string
  channel: string
  to_name?: string | null
  to_phone?: string | null
  to_email?: string | null
  title: string
  body: string
  status: string
  reason?: string | null
  created_at?: string
}

export function AnbuOutboxPage() {
  const [items, setItems] = useState<OutboxItem[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)

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
      body: JSON.stringify({ limit: 20 })
    })
    const data = await response.json().catch(() => ({}))
    setResult(data)
    await load()
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            운영실 · 알림 발송함
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            대기 중인 알림을 확인하고 발송합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            응답 없음, 복약, 병원 일정, 보호자 확인 필요 알림이 발송함에 쌓입니다.
            Webhook이 설정되어 있으면 실제 발송 서버로 전달됩니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-60"
            >
              새로고침
            </button>

            <button
              onClick={dispatch}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              대기 알림 발송
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.05em]">발송함</h2>
              <p className="mt-2 text-sm font-bold text-[#637B76]">{items.length}개 표시</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {items.length === 0 ? (
              <p className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                표시할 알림이 없습니다.
              </p>
            ) : (
              items.map((item) => (
                <article key={item.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                  <div className="flex flex-wrap gap-2">
                    <Badge text={item.status} />
                    <Badge text={item.channel} />
                    {item.reason ? <Badge text={item.reason} /> : null}
                  </div>

                  <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{item.title}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{item.body}</p>

                  <p className="mt-3 text-xs font-bold text-[#7A9692]">
                    수신자: {item.to_name || '-'} · {item.to_phone || item.to_email || '-'} · {item.created_at || ''}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">최근 처리 결과</h2>
          <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      </section>
    </main>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#DCEDE7]">
      {text}
    </span>
  )
}
