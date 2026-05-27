'use client'

import { useState } from 'react'

const plans = [
  {
    planId: 'free',
    name: '무료',
    price: 0,
    desc: '하루 1회 안부 체크와 기본 기록'
  },
  {
    planId: 'basic',
    name: '안부온 베이직',
    price: 9900,
    desc: '하루 3회 안부 체크, 응답 없음 알림, 주간 리포트'
  },
  {
    planId: 'plus',
    name: '안심케어 플러스',
    price: 29900,
    desc: '운영실 확인 요청, 케어파트너 연결 우선, 월간 리포트'
  }
]

export function AnbuBillingPage() {
  const [result, setResult] = useState<unknown>(null)
  const [loadingPlan, setLoadingPlan] = useState('')

  async function prepare(plan: typeof plans[number]) {
    setLoadingPlan(plan.planId)
    setResult(null)

    const response = await fetch('/api/anbu-payments/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    })

    const data = await response.json().catch(() => ({}))
    setResult(data)
    setLoadingPlan('')
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            결제 준비
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            안부온 구독과 사람 연결 결제를 준비합니다.
          </h1>
          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            결제 키가 없으면 결제 의도만 저장됩니다. 토스페이먼츠 키를 넣으면 결제창 호출 단계로 확장할 수 있습니다.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <section
              key={plan.planId}
              className={
                'rounded-[2rem] bg-white p-5 shadow-sm ring-1 sm:p-6 ' +
                (plan.planId === 'basic' ? 'ring-[#BEEFE3]' : 'ring-[#D8EEE8]')
              }
            >
              <h2 className="text-2xl font-black tracking-[-0.05em]">{plan.name}</h2>
              <div className="mt-3 text-4xl font-black tracking-[-0.06em] text-[#11977F]">
                {plan.price === 0 ? '0원' : plan.price.toLocaleString('ko-KR') + '원'}
              </div>
              <p className="mt-3 min-h-[4rem] text-sm font-bold leading-7 text-[#637B76]">
                {plan.desc}
              </p>
              <button
                onClick={() => prepare(plan)}
                disabled={Boolean(loadingPlan)}
                className="mt-5 w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-60"
              >
                {loadingPlan === plan.planId ? '준비 중...' : '결제 준비'}
              </button>
            </section>
          ))}
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">결제 준비 결과</h2>
          {result ? (
            <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <p className="mt-4 rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
              아직 선택한 요금제가 없습니다.
            </p>
          )}
        </section>
      </section>
    </main>
  )
}
