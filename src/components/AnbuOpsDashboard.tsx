'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type DashboardCard = {
  key: string
  label: string
  value: number
  help: string
  href: string
}

type QueueItem = {
  title: string
  desc: string
  time?: string
}

type Queue = {
  key: string
  title: string
  href: string
  empty: string
  items: QueueItem[]
}

type Shortcut = {
  label: string
  href: string
  desc: string
}

type DashboardData = {
  ok: boolean
  generatedAt: string
  cards: DashboardCard[]
  queues: Queue[]
  shortcuts: Shortcut[]
  diagnostics: Array<{
    label: string
    ok: boolean
    count: number
    error: unknown
  }>
  rawCounts: Record<string, number>
}

function timeLabel(value?: string) {
  if (!value) return '-'

  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) return value

  return date.toLocaleString('ko-KR')
}

function cardTone(key: string, value: number) {
  if (['risk', 'reports', 'outbox', 'payments'].includes(key) && value > 0) {
    return 'bg-[#FFF9EE] ring-[#F3DEB5]'
  }

  if (key === 'careRequests' && value > 0) {
    return 'bg-[#F7FBFF] ring-[#DCEDE7]'
  }

  return 'bg-white ring-[#D6EDE7]'
}

export function AnbuOpsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRaw, setShowRaw] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/anbu-ops/dashboard', { cache: 'no-store' })
      const json = await response.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : '운영실 대시보드를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const health = useMemo(() => {
    if (!data?.diagnostics) {
      return {
        okCount: 0,
        failCount: 0
      }
    }

    return {
      okCount: data.diagnostics.filter((item) => item.ok).length,
      failCount: data.diagnostics.filter((item) => !item.ok).length
    }
  }, [data])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-5 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            운영실 통합 대시보드
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            안부, 케어 요청, 파트너, 리포트를 한 화면에서 봅니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            운영자가 하루에 확인해야 하는 핵심 상태를 통합했습니다. SMS는 잔액 보호를 위해 일시정지 상태로 유지하고, 발송함과 리포트 검수 중심으로 운영합니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '불러오는 중...' : '새로고침'}
            </button>

            <button
              onClick={() => setShowRaw((value) => !value)}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              {showRaw ? '원본 숨기기' : '원본 보기'}
            </button>

            <Link
              href="/admin/ops/outbox"
              className="rounded-2xl bg-[#FFF9EE] px-5 py-4 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5]"
            >
              알림 발송함
            </Link>
          </div>

          <div className="mt-5 text-xs font-bold text-[#7A9692]">
            마지막 갱신: {data?.generatedAt ? timeLabel(data.generatedAt) : '-'} · 정상 테이블 {health.okCount}개 · 확인 필요 {health.failCount}개
          </div>
        </section>

        {error ? (
          <section className="rounded-[2rem] bg-[#FFF4F4] p-5 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8]">
            {error}
          </section>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.cards || []).map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className={'rounded-[2rem] p-5 shadow-sm ring-1 transition hover:-translate-y-0.5 ' + cardTone(card.key, card.value)}
            >
              <div className="text-sm font-black text-[#7A9692]">{card.label}</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#2AA897]">{card.value}</div>
              <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{card.help}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">운영 큐</h2>
            <p className="mt-2 text-sm font-bold text-[#637B76]">
              지금 바로 확인해야 할 항목입니다.
            </p>

            <div className="mt-5 space-y-4">
              {(data?.queues || []).map((queue) => (
                <div key={queue.key} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black tracking-[-0.04em]">{queue.title}</h3>
                    <Link href={queue.href} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                      보기
                    </Link>
                  </div>

                  <div className="mt-3 space-y-2">
                    {queue.items.length === 0 ? (
                      <p className="rounded-xl bg-white p-3 text-sm font-bold text-[#7A9692] ring-1 ring-[#D6EDE7]">
                        {queue.empty}
                      </p>
                    ) : (
                      queue.items.map((item, index) => (
                        <div key={`${queue.key}-${index}`} className="rounded-xl bg-white p-3 ring-1 ring-[#D6EDE7]">
                          <div className="text-sm font-black text-[#17443F]">{item.title}</div>
                          <p className="mt-1 text-xs font-bold leading-5 text-[#637B76]">{item.desc}</p>
                          <p className="mt-1 text-[11px] font-bold text-[#98AAA7]">{timeLabel(item.time)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">바로가기</h2>
            <p className="mt-2 text-sm font-bold text-[#637B76]">
              자주 쓰는 운영 화면입니다.
            </p>

            <div className="mt-5 grid gap-3">
              {(data?.shortcuts || []).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl bg-[#FAFFFD] p-4 transition hover:bg-[#EFFFFA] ring-1 ring-[#D6EDE7]"
                >
                  <div className="text-base font-black tracking-[-0.04em]">{item.label}</div>
                  <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">{item.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">데이터 연결 상태</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {(data?.diagnostics || []).map((item) => (
              <div
                key={item.label}
                className={
                  'rounded-2xl p-4 ring-1 ' +
                  (item.ok ? 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]' : 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]')
                }
              >
                <div className="text-sm font-black">{item.label}</div>
                <div className="mt-2 text-2xl font-black">{item.ok ? `${item.count}건` : '확인 필요'}</div>
                {!item.ok ? (
                  <p className="mt-2 text-xs font-bold leading-5">
                    Supabase SQL이 아직 실행되지 않았을 수 있습니다.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {showRaw ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">원본 데이터</h2>
            <pre className="mt-4 max-h-[30rem] overflow-auto rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              {JSON.stringify(data, null, 2)}
            </pre>
          </section>
        ) : null}
      </section>
    </main>
  )
}
