'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ConfirmResult = {
  ok?: boolean
  message?: string
  detail?: unknown
  order?: unknown
  subscription?: unknown
}

export function PaymentSuccessClient({
  paymentKey,
  orderId,
  amount
}: {
  paymentKey: string
  orderId: string
  amount: string
}) {
  const [result, setResult] = useState<ConfirmResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function confirm() {
      setLoading(true)

      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount)
          })
        })

        const data = await response.json()
        setResult(data)
      } catch (error) {
        setResult({
          ok: false,
          message: error instanceof Error ? error.message : '결제 승인 처리 중 오류가 발생했습니다.'
        })
      } finally {
        setLoading(false)
      }
    }

    confirm()
  }, [paymentKey, orderId, amount])

  const ok = Boolean(result?.ok)

  return (
    <section className="mx-auto max-w-3xl px-5 py-8 text-[#173B36]">
      <div className={
        'rounded-[2.5rem] p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 sm:p-8 ' +
        (ok ? 'bg-[#F3FFFB] ring-[#CDEFE5]' : 'bg-[#FFF8E8] ring-[#F4D8A5]')
      }>
        <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[#11977F]">
          안부웍스 결제
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          {loading ? '결제 승인 처리 중입니다.' : ok ? '결제가 완료되었습니다.' : '결제 승인 확인이 필요합니다.'}
        </h1>

        <p className="mt-4 text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          {loading
            ? '토스페이먼츠 인증 결과를 서버에서 최종 승인하고 있습니다.'
            : result?.message || '결제 처리 결과를 확인해주세요.'}
        </p>

        <div className="mt-5 grid gap-2 rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
          <div>주문번호: {orderId}</div>
          <div>결제금액: {Number(amount).toLocaleString('ko-KR')}원</div>
          <div>결제키: {paymentKey ? paymentKey.slice(0, 14) + '...' : '-'}</div>
        </div>

        {!loading && !ok ? (
          <pre className="mt-5 max-h-80 overflow-auto rounded-2xl bg-white p-4 text-xs leading-6 text-[#795313] ring-1 ring-[#F4D8A5]">
            {JSON.stringify(result?.detail || result, null, 2)}
          </pre>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/billing" className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white">
            결제내역 보기
          </Link>
          <Link href="/child/daily-care" className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white">
            보호자 화면
          </Link>
          <Link href="/setup/payments" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
            결제 설정 확인
          </Link>
        </div>
      </div>
    </section>
  )
}
