'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function BillingSuccessPage() {
  const [result, setResult] = useState<any>({
    loading: true,
    message: '결제 승인 확인 중입니다.'
  })

  useEffect(() => {
    async function confirm() {
      const params = new URLSearchParams(window.location.search)
      const paymentKey = params.get('paymentKey') || ''
      const orderId = params.get('orderId') || ''
      const amount = params.get('amount') || ''

      const response = await fetch('/api/anbu-payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount })
      })

      const data = await response.json().catch(() => ({}))
      setResult(data)
    }

    confirm().catch((error) => {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : '결제 승인 중 오류가 발생했습니다.'
      })
    })
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            결제 결과
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-[-0.07em]">
            {result.ok ? '결제와 구독 활성화가 완료되었습니다.' : '결제 확인이 필요합니다.'}
          </h1>

          <p className="mt-4 text-base font-bold leading-7 text-[#637B76]">
            {result.message || '처리 결과를 확인해주세요.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/subscription" className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white">
              구독 관리
            </Link>
            <Link href="/child/weekly-report" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              주간 리포트
            </Link>
          </div>
        </section>

        <pre className="max-h-[30rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
          {JSON.stringify(result, null, 2)}
        </pre>
      </section>
    </main>
  )
}
