'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type PaymentOrder = {
  id: string
  order_id: string
  order_name: string
  plan_name: string
  amount: number
  payment_status: string
  paid_at?: string | null
  requested_at?: string | null
  failure_reason?: string | null
}

type Subscription = {
  id: string
  plan_name: string
  subscription_status: string
  current_period_start?: string | null
  current_period_end?: string | null
}

const statusLabels: Record<string, string> = {
  ready: '결제 대기',
  paid: '결제 완료',
  failed: '실패',
  config_missing: '설정 필요',
  cancelled: '취소'
}

export function BillingPanel() {
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/payments/orders', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '결제 내역을 불러오지 못했습니다.')
      }

      setOrders(data.orders || [])
      setSubscriptions(data.subscriptions || [])

      if (data.message) setMessage(data.message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '결제 내역을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 text-[#173B36]">
      <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
        <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
          안부웍스 결제내역
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          구독 상태와 결제내역을
          <br />
          확인하세요.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          부모님 연결코드 기준으로 결제 주문, 결제 완료 여부, 활성 구독을 확인합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={load} className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white">
            새로고침
          </button>
          
        </div>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 rounded-[2rem] bg-white p-6 text-center font-black shadow-sm ring-1 ring-[#D8EEE8]">
          불러오는 중...
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">활성 구독</h2>

          <div className="mt-4 grid gap-3">
            {!loading && subscriptions.length === 0 ? (
              <p className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-black leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                아직 활성 구독이 없습니다.
              </p>
            ) : null}

            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="rounded-2xl bg-[#EFFFF9] p-4 ring-1 ring-[#CDEFE5]">
                <div className="text-lg font-black text-[#116D5F]">{subscription.plan_name}</div>
                <div className="mt-2 text-sm font-bold text-[#637B76]">
                  상태: {subscription.subscription_status}
                </div>
                {subscription.current_period_end ? (
                  <div className="mt-1 text-sm font-bold text-[#637B76]">
                    이용기간 종료: {new Date(subscription.current_period_end).toLocaleDateString('ko-KR')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-2xl font-black tracking-[-0.05em]">결제 주문</h2>

          {!loading && orders.length === 0 ? (
            <p className="rounded-[2rem] bg-white p-6 text-sm font-black leading-7 text-[#637B76] shadow-sm ring-1 ring-[#D8EEE8]">
              아직 결제 주문이 없습니다.
            </p>
          ) : null}

          {orders.map((order) => (
            <article key={order.id} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <div className="flex flex-wrap gap-2">
                <Badge text={statusLabels[order.payment_status] || order.payment_status} />
                <Badge text={order.plan_name} />
              </div>

              <h3 className="mt-4 text-2xl font-black tracking-[-0.05em]">{order.order_name}</h3>

              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                주문번호: {order.order_id}
              </p>

              <p className="mt-1 text-xl font-black text-[#11977F]">
                {Number(order.amount || 0).toLocaleString('ko-KR')}원
              </p>

              {order.paid_at ? (
                <p className="mt-2 text-sm font-bold text-[#637B76]">
                  결제일: {new Date(order.paid_at).toLocaleString('ko-KR')}
                </p>
              ) : null}

              {order.failure_reason ? (
                <p className="mt-3 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-bold leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
                  {order.failure_reason}
                </p>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </section>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#EFFFF9] px-3 py-1 text-xs font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
      {text}
    </span>
  )
}
