'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Plan = {
  id: string
  name: string
  priceLabel: string
  desc: string
  features: string[]
  cta: string
}

type SubscriptionStatus = {
  ok: boolean
  familyCode?: string
  currentPlanName?: string
  subscriptionEndLabel?: string
  canViewWeeklyReport?: boolean
  canStartTrial?: boolean
  plans?: Plan[]
  message?: string
}

function cardClass(planId: string) {
  if (planId === 'basic') return 'bg-[#F8FFFC] ring-[#BEEFE3]'
  return 'bg-white ring-[#D8EEE8]'
}

export function AnbuSubscriptionPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-subscriptions/status', { cache: 'no-store' })
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '구독 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function startTrial() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-subscriptions/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '무료 체험을 시작하지 못했습니다.')
      } else {
        setMessage(data.message || '무료 체험이 시작되었습니다.')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '무료 체험을 시작하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const plans = status?.plans || []

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부웍스 구독
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            주간 리포트와 보호자 알림을 구독으로 연결합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            무료 사용자는 부모님 연결과 기본 안부 체크를 사용할 수 있고, 베이직 체험 또는 구독 사용자는 주간 리포트 전체를 볼 수 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '확인 중...' : '구독 상태 새로고침'}
            </button>

            <Link
              href="/child/weekly-report"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              주간 리포트 보기
            </Link>
          </div>
        </section>

        {message ? (
          <section className="rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
            {message}
          </section>
        ) : null}

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">현재 상태</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <StatusBox label="가족 코드" value={status?.familyCode || '-'} />
            <StatusBox label="현재 플랜" value={status?.currentPlanName || '무료'} />
            <StatusBox label="리포트 접근" value={status?.canViewWeeklyReport ? '가능' : '미리보기'} />
            <StatusBox label="종료일" value={status?.subscriptionEndLabel || '-'} />
          </div>

          {!status?.familyCode ? (
            <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-bold leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              부모님 연결코드가 없습니다. 먼저 부모님을 연결해야 체험 구독을 시작할 수 있습니다.
              <div className="mt-3">
                <Link href="/family-link" className="rounded-xl bg-[#193B38] px-4 py-2 text-sm font-black text-white">
                  부모님 연결하기
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <section key={plan.id} className={'rounded-[2rem] p-5 shadow-sm ring-1 sm:p-6 ' + cardClass(plan.id)}>
              <h2 className="text-2xl font-black tracking-[-0.05em]">{plan.name}</h2>
              <div className="mt-3 text-3xl font-black text-[#11977F]">{plan.priceLabel}</div>
              <p className="mt-3 min-h-[4.5rem] text-sm font-bold leading-7 text-[#637B76]">{plan.desc}</p>

              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="rounded-2xl bg-white p-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                    ✓ {feature}
                  </div>
                ))}
              </div>

              {plan.id === 'basic' ? (
                <button
                  onClick={startTrial}
                  disabled={loading || !status?.canStartTrial}
                  className="mt-5 w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:bg-[#9FB8B3]"
                >
                  {status?.canStartTrial ? plan.cta : '체험/구독 사용 중'}
                </button>
              ) : plan.id === 'plus' ? (
                <Link
                  href="/contact"
                  className="mt-5 block w-full rounded-2xl bg-white px-5 py-4 text-center text-base font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
                >
                  상담 문의
                </Link>
              ) : (
                <Link
                  href="/family-link"
                  className="mt-5 block w-full rounded-2xl bg-white px-5 py-4 text-center text-base font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
                >
                  무료로 시작
                </Link>
              )}
            </section>
          ))}
        </div>

        <section className="rounded-[2rem] bg-[#123F38] p-5 text-white sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">다음 유료화 흐름</h2>
          <ol className="mt-4 space-y-3 text-sm font-bold leading-7 text-[#E7FFF7]">
            <li>1. 보호자가 부모님을 연결합니다.</li>
            <li>2. 7일 무료 체험으로 주간 리포트를 확인합니다.</li>
            <li>3. 체험 종료 전 결제 화면으로 연결합니다.</li>
            <li>4. 결제 성공 후 주간 리포트, 응답 없음 알림, 복약 확인 알림을 유지합니다.</li>
          </ol>
        </section>
      </section>
    </main>
  )
}

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
      <div className="text-xs font-black text-[#7A9692]">{label}</div>
      <div className="mt-2 break-words text-lg font-black text-[#173B36]">{value}</div>
    </div>
  )
}
