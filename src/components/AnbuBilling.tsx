'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

declare global {
  interface Window {
    TossPayments?: any
  }
}

const plans = [
  {
    planId: 'basic',
    name: '안부온 베이직',
    price: 9900,
    desc: '주간 리포트, 응답 없음 알림, 복약·식사 확인 필요 알림'
  },
  {
    planId: 'plus',
    name: '안심케어 플러스',
    price: 29900,
    desc: '운영실 확인 요청, 케어파트너 연결 우선, 월간 리포트'
  }
]

function loadTossSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.TossPayments) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-toss-sdk="true"]')

    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('토스페이먼츠 SDK 로딩 실패')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v2/standard'
    script.async = true
    script.dataset.tossSdk = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('토스페이먼츠 SDK 로딩 실패'))
    document.head.appendChild(script)
  })
}

function getCustomerKey() {
  const key = window.localStorage.getItem('anbuworks_customer_key')
  if (key) return key

  const next =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `ANBU-CUSTOMER-${crypto.randomUUID()}`
      : `ANBU-CUSTOMER-${Date.now()}-${Math.floor(Math.random() * 10000)}`

  window.localStorage.setItem('anbuworks_customer_key', next)
  return next
}

export function AnbuBillingPage() {
  const [result, setResult] = useState<any>(null)
  const [loadingPlan, setLoadingPlan] = useState('')
  const [customerName, setCustomerName] = useState('보호자')
  const [customerEmail, setCustomerEmail] = useState('')
  const [familyCode, setFamilyCode] = useState('')

  useEffect(() => {
    setCustomerEmail(window.localStorage.getItem('anbuworks_customer_email') || '')
  }, [])

  async function prepare(plan: typeof plans[number]) {
    setLoadingPlan(plan.planId)
    setResult(null)

    try {
      const response = await fetch('/api/anbu-payments/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plan, familyCode })
      })

      const data = await response.json().catch(() => ({}))
      setResult(data)

      if (!data.ok) {
        setLoadingPlan('')
        return
      }

      if (!data.clientKey) {
        setResult({
          ...data,
          nextStep: 'Toss 키가 없어 결제창은 열리지 않습니다. /ops/subscriptions에서 수동 활성화로 테스트하세요.'
        })
        setLoadingPlan('')
        return
      }

      if (customerEmail) {
        window.localStorage.setItem('anbuworks_customer_email', customerEmail)
      }

      await loadTossSdk()

      const tossPayments = window.TossPayments(data.clientKey)
      const payment = tossPayments.payment({
        customerKey: getCustomerKey()
      })

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: data.amount
        },
        orderId: data.orderId,
        orderName: data.planName,
        successUrl: `${window.location.origin}/billing/success?orderId=${encodeURIComponent(data.orderId)}&amount=${encodeURIComponent(String(data.amount))}`,
        failUrl: `${window.location.origin}/billing/fail`,
        customerName,
        customerEmail
      })
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : '결제 준비 중 오류가 발생했습니다.'
      })
    } finally {
      setLoadingPlan('')
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부웍스 결제
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            결제 성공 시 구독 상태를 자동으로 활성화합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            Toss 테스트키가 있으면 결제창을 열 수 있습니다. 아직 Toss 키가 없으면 운영실 수동 활성화로 주간 리포트 구독 흐름을 테스트하세요.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">결제 정보</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Input label="가족 연결코드" value={familyCode} onChange={setFamilyCode} placeholder="비워두면 최신 가족 사용" />
            <Input label="결제자 이름" value={customerName} onChange={setCustomerName} />
            <Input label="이메일" value={customerEmail} onChange={setCustomerEmail} placeholder="선택" />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => (
            <section
              key={plan.planId}
              className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6"
            >
              <h2 className="text-2xl font-black tracking-[-0.05em]">{plan.name}</h2>
              <div className="mt-3 text-4xl font-black tracking-[-0.06em] text-[#11977F]">
                {plan.price.toLocaleString('ko-KR')}원
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
          <h2 className="text-2xl font-black tracking-[-0.05em]">운영 테스트</h2>
          <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
            Toss 키가 없는 동안은 운영실에서 가족코드로 구독을 수동 활성화해 주간 리포트 접근을 테스트하세요.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/ops/subscriptions" className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white">
              운영실 구독 관리
            </Link>
            <Link href="/subscription" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              구독 관리
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">처리 결과</h2>
          {result ? (
            <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <p className="mt-4 rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
              아직 결제 준비를 시작하지 않았습니다.
            </p>
          )}
        </section>
      </section>
    </main>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder = ''
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}
