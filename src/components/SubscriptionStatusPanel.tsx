'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type BillingStatus = {
  ok: boolean
  connected: boolean
  familyCode: string | null
  billingReady: boolean
  plan: {
    id: string
    name: string
    displayPrice: string
    description: string
    level: number
    limits: {
      dailyChecks: number
      guardians: number
      historyDays: number
      opsRequestsPerMonth: number
      weeklyReport: boolean
      routines: boolean
      partnerPriority: boolean
      assignments: boolean
    }
    features: string[]
  }
  subscription: {
    id?: string
    current_period_end?: string | null
    subscription_status?: string | null
  } | null
  usage: {
    dailyCheckCount: number
    dailyLimit: number
    remainingDailyChecks: number
    limitReached: boolean
  }
  access: {
    weeklyReport: boolean
    routines: boolean
    partnerPriority: boolean
    assignments: boolean
    opsRequestsPerMonth: number
  }
}

export function SubscriptionStatusPanel() {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/billing/status', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '구독 상태를 불러오지 못했습니다.')
      }

      setStatus(data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '구독 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function startFreeTrial() {
    setMessage('무료 체험을 시작하는 중입니다...')

    try {
      const response = await fetch('/api/billing/free-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '무료 체험 시작에 실패했습니다.')
      }

      setMessage(data.created ? '무료 체험이 시작되었습니다.' : '이미 활성 구독이 있습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '무료 체험 시작에 실패했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const plan = status?.plan

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 text-[#173B36]">
      <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
        <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
          안부웍스 구독상태
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          현재 이용 중인 플랜과
          <br />
          기능 제한을 확인하세요.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          안부온은 플랜에 따라 하루 안부 체크 횟수, 주간 리포트, 안부 루틴, 운영실 확인 요청 기능이 달라집니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={load}
            className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
          >
            새로고침
          </button>
          <Link
            href="/pricing"
            className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white"
          >
            요금제 보기
          </Link>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            {message}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-5 rounded-[2rem] bg-white p-6 text-center font-black shadow-sm ring-1 ring-[#D8EEE8]">
          불러오는 중...
        </div>
      ) : null}

      {!loading && !status?.connected ? (
        <div className="mt-5 rounded-[2rem] bg-[#FFF8E8] p-6 shadow-sm ring-1 ring-[#F4D8A5]">
          <h2 className="text-2xl font-black tracking-[-0.05em] text-[#795313]">
            부모님 연결이 먼저 필요합니다.
          </h2>
          <p className="mt-3 text-sm font-bold leading-7 text-[#795313]">
            구독 상태는 부모님 연결코드 기준으로 관리됩니다. 먼저 보호자가 부모님 연결코드를 만들어주세요.
          </p>
          <Link
            href="/family-link"
            className="mt-5 inline-flex rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
          >
            부모님 연결하기
          </Link>
        </div>
      ) : null}

      {plan && status?.connected ? (
        <>
          <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <div className="text-sm font-black text-[#11977F]">현재 플랜</div>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.07em]">{plan.name}</h2>
              <div className="mt-3 text-3xl font-black text-[#11977F]">{plan.displayPrice}</div>
              <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">{plan.description}</p>

              {status.subscription?.current_period_end ? (
                <div className="mt-4 rounded-2xl bg-[#F8FCFB] p-4 text-sm font-black text-[#637B76] ring-1 ring-[#D8EEE8]">
                  이용기간 종료: {new Date(status.subscription.current_period_end).toLocaleDateString('ko-KR')}
                </div>
              ) : null}

              {plan.id === 'free' && !status.subscription ? (
                <button
                  onClick={startFreeTrial}
                  className="mt-5 w-full rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
                >
                  무료 체험 시작
                </button>
              ) : null}
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <div className="text-sm font-black text-[#11977F]">오늘 안부 체크 사용량</div>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.07em]">
                {status.usage.dailyCheckCount} / {status.usage.dailyLimit}
              </h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                오늘 남은 안부 체크: {status.usage.remainingDailyChecks}회
              </p>

              {status.usage.limitReached ? (
                <div className="mt-4 rounded-2xl bg-[#FFF1F1] p-4 text-sm font-black leading-7 text-[#8A2525] ring-1 ring-[#F3BBBB]">
                  오늘 안부 체크 한도를 모두 사용했습니다. 더 자주 확인하려면 상위 플랜으로 전환하세요.
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
                  오늘 안부 체크를 더 보낼 수 있습니다.
                </div>
              )}
            </section>
          </div>

          <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">사용 가능한 기능</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Feature label="주간 리포트" enabled={status.access.weeklyReport} />
              <Feature label="안부 루틴" enabled={status.access.routines} />
              <Feature label="케어파트너 우선 연결" enabled={status.access.partnerPriority} />
              <Feature label="배정 현황 확인" enabled={status.access.assignments} />
              <Feature label={`보호자 ${plan.limits.guardians}명`} enabled />
              <Feature label={`기록 ${plan.limits.historyDays}일`} enabled />
              <Feature label={`운영실 요청 월 ${plan.limits.opsRequestsPerMonth}회`} enabled={plan.limits.opsRequestsPerMonth > 0} />
              <Feature label={`하루 체크 ${plan.limits.dailyChecks}회`} enabled />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Link href="/checkout?plan=basic" className="rounded-2xl bg-[#F2FAF8] px-5 py-4 text-center text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
                베이직 전환
              </Link>
              <Link href="/checkout?plan=family" className="rounded-2xl bg-[#EFFFF9] px-5 py-4 text-center text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
                패밀리 전환
              </Link>
              <Link href="/checkout?plan=plus" className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white">
                플러스 전환
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </section>
  )
}

function Feature({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div
      className={
        'rounded-2xl p-4 text-sm font-black leading-6 ring-1 ' +
        (enabled
          ? 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
          : 'bg-[#F7F7F7] text-[#7A8482] ring-[#E3E3E3]')
      }
    >
      {enabled ? '✓ ' : '잠김 · '}
      {label}
    </div>
  )
}
