'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnbuWeeklyReport } from '@/components/AnbuWeeklyReport'

type SubscriptionStatus = {
  ok: boolean
  familyCode?: string
  currentPlanName?: string
  canViewWeeklyReport?: boolean
  canStartTrial?: boolean
  subscriptionEndLabel?: string
}

export function AnbuReportSubscriptionFrame() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/anbu-subscriptions/status', { cache: 'no-store' })
      const data = await response.json()
      setStatus(data)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  async function startTrial() {
    setMessage('')

    const response = await fetch('/api/anbu-subscriptions/start-trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok || !data.ok) {
      setMessage(data.message || '체험을 시작하지 못했습니다.')
    } else {
      setMessage(data.message || '7일 체험이 시작되었습니다.')
    }

    await load()
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
        <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center text-lg font-black shadow-sm ring-1 ring-[#D8EEE8]">
          구독 상태를 확인하는 중입니다.
        </section>
      </main>
    )
  }

  if (status?.canViewWeeklyReport) {
    return <AnbuWeeklyReport />
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#FFF8E8] px-4 py-2 text-sm font-black text-[#795313] ring-1 ring-[#F4D8A5]">
            베이직 리포트 미리보기
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            주간 돌봄 리포트는 베이직 체험 후 전체 확인할 수 있습니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            최근 7일 식사, 복약, 몸 상태, 응답 없음, 보호자 SMS 알림 기록을 자동으로 요약합니다.
            7일 체험을 시작하면 전체 리포트를 바로 확인할 수 있습니다.
          </p>

          {message ? (
            <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
              {message}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {status?.familyCode ? (
              <button
                onClick={startTrial}
                className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
              >
                7일 무료 체험 시작
              </button>
            ) : (
              <Link
                href="/family-link"
                className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
              >
                부모님 먼저 연결하기
              </Link>
            )}

            <Link
              href="/subscription"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              구독 플랜 보기
            </Link>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['안부 응답률', '최근 7일 중 몇 일 응답했는지 확인'],
            ['복약·식사 신호', '약 깜빡함, 식사 미확인 기록 요약'],
            ['다음 행동 추천', '보호자가 오늘 확인할 일 자동 제안']
          ].map(([title, desc]) => (
            <section key={title} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
              <h2 className="text-xl font-black tracking-[-0.05em]">{title}</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}
