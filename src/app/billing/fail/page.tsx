'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function BillingFailPage() {
  const [params, setParams] = useState<Record<string, string>>({})

  useEffect(() => {
    const next: Record<string, string> = {}
    const search = new URLSearchParams(window.location.search)

    for (const [key, value] of search.entries()) {
      next[key] = value
    }

    setParams(next)
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FFF8F8_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#17443F]">
      <section className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#F3C8C8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#FFF4F4] px-4 py-2 text-sm font-black text-[#8A3030]">
            결제 실패
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-[-0.07em]">
            결제가 완료되지 않았습니다.
          </h1>

          <p className="mt-4 text-base font-bold leading-7 text-[#637B76]">
            결제 수단이나 인증 상태를 확인한 뒤 다시 시도해주세요.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/billing" className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
              다시 결제하기
            </Link>
            <Link href="/contact" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              문의하기
            </Link>
          </div>
        </section>

        <pre className="max-h-[30rem] overflow-auto rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
          {JSON.stringify(params, null, 2)}
        </pre>
      </section>
    </main>
  )
}
