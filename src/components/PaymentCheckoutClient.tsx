'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { anbuPaymentPlans, formatWon, getAnbuPaymentPlan } from '@/lib/anbu-payment-plans'
import Link from 'next/link'

declare global {
  interface Window {
    TossPayments?: any
  }
}

type PaymentOrder = {
  order_id: string
  order_name: string
  amount: number
  customer_key?: string
  buyer_name?: string
  buyer_phone?: string
}

function loadTossPaymentsScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.TossPayments) {
      resolve()
      return
    }

    const existing = document.querySelector('script[data-toss-payments="true"]') as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('토스페이먼츠 SDK 로딩 실패')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v2/standard'
    script.async = true
    script.dataset.tossPayments = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('토스페이먼츠 SDK 로딩 실패'))
    document.head.appendChild(script)
  })
}

function phoneDigits(value: string) {
  return value.replace(/[^\d]/g, '')
}

export function PaymentCheckoutClient({ initialPlanId = 'basic' }: { initialPlanId?: string }) {
  const [planId, setPlanId] = useState(initialPlanId)
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [familyCode, setFamilyCode] = useState('')
  const [message, setMessage] = useState('')
  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [loading, setLoading] = useState(false)

  const plan = useMemo(() => getAnbuPaymentPlan(planId) || getAnbuPaymentPlan('basic'), [planId])

  async function createOrder() {
    if (!plan) throw new Error('요금제를 찾지 못했습니다.')

    const response = await fetch('/api/payments/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.id,
        buyerName,
        buyerPhone,
        buyerEmail,
        familyCode
      })
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      throw new Error(data.message || '주문 생성에 실패했습니다.')
    }

    setOrder(data.order)

    return data as {
      ok: boolean
      order: PaymentOrder
      tossClientKey: string
      tossReady: boolean
    }
  }

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const data = await createOrder()

      if (!data.tossClientKey) {
        setMessage('토스페이먼츠 클라이언트 키가 없습니다. /setup/payments에서 환경변수를 설정해주세요.')
        return
      }

      await loadTossPaymentsScript()

      if (!window.TossPayments) {
        throw new Error('토스페이먼츠 SDK를 불러오지 못했습니다.')
      }

      const tossPayments = window.TossPayments(data.tossClientKey)
      const payment = tossPayments.payment({
        customerKey: data.order.customer_key || 'ANBU_CUSTOMER'
      })

      const origin = window.location.origin

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: data.order.amount
        },
        orderId: data.order.order_id,
        orderName: data.order.order_name,
        successUrl: `${origin}/payments/success`,
        failUrl: `${origin}/payments/fail`,
        customerName: buyerName || '보호자',
        customerMobilePhone: phoneDigits(buyerPhone),
        customerEmail: buyerEmail || undefined,
        flowMode: 'DEFAULT'
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '결제 요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!plan) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8]">
          지원하지 않는 요금제입니다.
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 text-[#173B36]">
      <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
        <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
          안부웍스 결제
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          요금제를 선택하고
          <br />
          결제를 시작하세요.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          결제 요청 전 주문을 서버에 먼저 저장하고, 토스페이먼츠 결제 완료 후 서버에서 승인합니다.
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">선택한 요금제</h2>

          <div className="mt-4 grid gap-3">
            {anbuPaymentPlans.filter((item) => item.id !== 'free').map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPlanId(item.id)}
                className={
                  'rounded-2xl p-4 text-left ring-1 transition ' +
                  (planId === item.id
                    ? 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
                    : 'bg-[#F8FCFB] text-[#173B36] ring-[#D8EEE8]')
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-lg font-black">{item.name}</div>
                  <div className="text-sm font-black">{item.displayPrice}</div>
                </div>
                <p className="mt-2 text-sm font-bold leading-6 opacity-80">{item.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">결제 정보</h2>

          <form onSubmit={handlePayment} className="mt-5 grid gap-3">
            <Input label="보호자 이름" value={buyerName} onChange={setBuyerName} placeholder="예: 이가영" required />
            <Input label="보호자 연락처" value={buyerPhone} onChange={setBuyerPhone} placeholder="예: 010-0000-0000" required />
            <Input label="이메일" value={buyerEmail} onChange={setBuyerEmail} placeholder="선택 입력" />
            <Input label="부모님 연결코드" value={familyCode} onChange={setFamilyCode} placeholder="선택 입력. 예: 2580" />

            <div className="rounded-[1.75rem] bg-[#123F38] p-5 text-white">
              <div className="text-sm font-black text-[#9DF4DD]">결제 금액</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.06em]">
                {formatWon(plan.amount)}
              </div>
              <p className="mt-2 text-sm font-bold leading-6 text-[#CDEEE6]">
                {plan.orderName}
              </p>
            </div>

            {message ? (
              <div className="rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
                {message}
              </div>
            ) : null}

            {order ? (
              <div className="rounded-2xl bg-[#F8FCFB] p-4 text-xs font-bold leading-6 text-[#637B76] ring-1 ring-[#D8EEE8]">
                주문번호: {order.order_id}
              </div>
            ) : null}

            <button
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-60"
            >
              {loading ? '결제 준비 중...' : '결제하기'}
            </button>

            <Link
              href="/setup/payments"
              className="rounded-2xl bg-[#F2FAF8] px-5 py-4 text-center text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]"
            >
              결제 설정 확인
            </Link>
          </form>
        </section>
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8] sm:p-6">
        결제는 의료행위나 응급 판단에 대한 비용이 아닙니다. 안부 확인, 보호자 알림, 운영실 확인, 케어파트너 연결 서비스 이용료입니다.
      </div>
    </section>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  required = false
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}
