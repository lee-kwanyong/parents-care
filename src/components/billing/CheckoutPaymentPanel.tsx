'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { purchasablePlans } from '@/lib/anbu-pricing'

type TossPaymentObject = {
  requestPayment: (params: Record<string, unknown>) => Promise<void>
}

type TossPaymentsObject = {
  payment: (params: { customerKey: string }) => TossPaymentObject
}

declare global {
  interface Window {
    TossPayments?: any
  }
}

type CheckoutOrder = {
  orderId: string
  orderName: string
  amount: number
  currency: 'KRW'
  customerName: string
  customerEmail: string
  customerMobilePhone: string
  customerKey: string
  planCode: string
  planTitle: string
  generatedReferralCode: string
  usedReferralCode: string
  successUrl: string
  failUrl: string
}

const plans = purchasablePlans()

function loadTossSdk() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('브라우저에서만 결제창을 열 수 있습니다.'))
    if (window.TossPayments) return resolve()

    const existing = document.querySelector<HTMLScriptElement>('script[data-toss-sdk="true"]')

    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('토스페이먼츠 SDK 로드 실패')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v2/standard'
    script.async = true
    script.dataset.tossSdk = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'))
    document.head.appendChild(script)
  })
}

function digits(value: string) {
  return value.replace(/[^\d]/g, '')
}

function initialQuery(name: string) {
  if (typeof window === 'undefined') return ''

  return new URLSearchParams(window.location.search).get(name) || ''
}

export function CheckoutPaymentPanel() {
  const [planCode, setPlanCode] = useState('two-week-care-basic-179000')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [generatedReferralCode, setGeneratedReferralCode] = useState('')
  const [order, setOrder] = useState<CheckoutOrder | null>(null)
  const [clientKey, setClientKey] = useState('')
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [paying, setPaying] = useState(false)

  const selectedPlan = useMemo(
    () => plans.find((item) => item.code === planCode) || plans[0],
    [planCode]
  )

  useEffect(() => {
    const plan = initialQuery('plan')
    const ref = initialQuery('ref')

    if (plans.some((item) => item.code === plan)) setPlanCode(plan)
    if (ref) setReferralCode(ref.replace(/[^\w-]/g, '').slice(0, 60).toUpperCase())
  }, [])

  async function createOrder(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (!customerName.trim()) {
      setMessage('이름을 입력해주세요.')
      return
    }

    if (digits(customerPhone).length < 8) {
      setMessage('연락처를 입력해주세요.')
      return
    }

    setCreating(true)
    setMessage('')

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          planCode,
          customerName,
          customerPhone,
          customerEmail,
          referralCode,
          generatedReferralCode
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '주문 생성에 실패했습니다.')
      }

      setClientKey(String(result.clientKey || ''))
      setOrder(result.order as CheckoutOrder)
      setGeneratedReferralCode(String(result.order?.generatedReferralCode || ''))
      setMessage('결제 주문이 생성되었습니다. 아래 결제 버튼을 눌러주세요.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '주문 생성 중 오류가 발생했습니다.')
    } finally {
      setCreating(false)
    }
  }

  async function requestPayment() {
    if (!order || !clientKey) {
      setMessage('먼저 결제 주문을 생성해주세요.')
      return
    }

    setPaying(true)
    setMessage('')

    try {
      await loadTossSdk()

      if (!window.TossPayments) {
        throw new Error('토스페이먼츠 SDK가 준비되지 않았습니다.')
      }

      const tossPayments = window.TossPayments(clientKey)
      const payment = tossPayments.payment({
        customerKey: order.customerKey
      })

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: order.amount
        },
        orderId: order.orderId,
        orderName: order.orderName,
        customerName: order.customerName,
        customerEmail: order.customerEmail || undefined,
        customerMobilePhone: order.customerMobilePhone,
        successUrl: order.successUrl,
        failUrl: order.failUrl,
        metadata: {
          planCode: order.planCode,
          referralCode: order.usedReferralCode || '',
          generatedCode: order.generatedReferralCode || ''
        }
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '결제창을 여는 중 오류가 발생했습니다.')
      setPaying(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7] sm:p-9">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
            안부웍스 결제
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
            리포트와 케어를
            <br />
            구분해서 결제합니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            월 9,900원과 49,000원은 방문 인력이 포함되지 않습니다. 퇴원 후 14일 케어는 생활확인 파트너 포함 여부에 따라 99,000원부터 시작합니다.
          </p>
        </section>

        <form onSubmit={createOrder} className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <h2 className="text-2xl font-black tracking-[-0.06em]">요금제 선택</h2>

            <div className="mt-5 grid gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => {
                    setPlanCode(plan.code)
                    setOrder(null)
                  }}
                  className={
                    'rounded-2xl p-5 text-left ring-1 transition ' +
                    (planCode === plan.code
                      ? 'bg-[#EFFFFA] text-[#17443F] ring-[#2AA897]'
                      : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                      {plan.badge}
                    </span>
                    {plan.partnerVisits ? (
                      <span className="rounded-full bg-[#FFF9EE] px-3 py-1 text-xs font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
                        방문 {plan.partnerVisits}회 포함
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 text-sm font-black text-[#247A71]">{plan.priceLabel}</div>
                  <div className="mt-2 text-2xl font-black tracking-[-0.06em]">{plan.title}</div>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{plan.desc}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <h2 className="text-2xl font-black tracking-[-0.06em]">결제 정보</h2>

            <div className="mt-5 grid gap-3">
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value.slice(0, 80))}
                placeholder="이름"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
              />

              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value.slice(0, 20))}
                placeholder="연락처"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
              />

              <input
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value.slice(0, 120))}
                placeholder="이메일 선택"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
              />

              <input
                value={referralCode}
                onChange={(event) => setReferralCode(event.target.value.replace(/[^\w-]/g, '').slice(0, 60).toUpperCase())}
                placeholder="추천인코드 선택"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="mt-5 w-full rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-60"
            >
              {creating ? '주문 생성 중...' : '결제 주문 생성'}
            </button>

            {order ? (
              <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                <div className="text-sm font-black text-[#637B76]">주문명</div>
                <div className="mt-1 text-xl font-black">{order.orderName}</div>

                <div className="mt-4 text-sm font-black text-[#637B76]">결제금액</div>
                <div className="mt-1 text-3xl font-black tracking-[-0.08em]">
                  {order.amount.toLocaleString('ko-KR')}원
                </div>

                {order.generatedReferralCode ? (
                  <div className="mt-4 rounded-xl bg-[#EFFFFA] p-3 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                    내 추천인코드: {order.generatedReferralCode}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={requestPayment}
                  disabled={paying}
                  className="mt-5 w-full rounded-2xl bg-[#17443F] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
                >
                  {paying ? '결제창 여는 중...' : `${selectedPlan.priceLabel} 결제하기`}
                </button>
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
                {message}
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl bg-white p-4 text-xs font-bold leading-6 text-[#637B76] ring-1 ring-[#EDF6F3]">
              월 9,900원은 현재 첫 1개월 일반결제로 활성화됩니다. 자동 정기결제는 빌링키 연동 후 별도로 고도화합니다.
            </div>
          </section>
        </form>

        <div className="text-center">
          <Link href="/pricing" className="text-sm font-black text-[#247A71]">
            요금제로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  )
}
