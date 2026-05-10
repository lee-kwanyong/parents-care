'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type AnyRow = Record<string, any>

function formatWon(value: number) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

export function ManagerEarningsBoard() {
  const [earnings, setEarnings] = useState<AnyRow[]>([])
  const [summary, setSummary] = useState({ expectedEarnings: 0, paidEarnings: 0 })
  const [message, setMessage] = useState('')

  async function load() {
    setMessage('')

    try {
      const response = await fetch('/api/manager-mobile', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '정산 정보를 불러오지 못했습니다.')
      }

      setEarnings(result.earnings || [])
      setSummary(result.summary || { expectedEarnings: 0, paidEarnings: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '정산 정보를 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-4xl">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="text-sm font-black text-[#19A98E]">정산 예정</div>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
            이번 주 예상 정산
          </h1>
          <p className="mt-4 text-base font-bold leading-7 text-[#607D79]">
            완료한 케어 건은 예상 정산에 반영됩니다. 실제 지급은 운영 정책에 따라 확정됩니다.
          </p>
        </header>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        <section className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-6 ring-1 ring-[#E3EFEC] shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <div className="text-sm font-black text-[#718A87]">예상 정산</div>
            <div className="mt-2 text-4xl font-black text-[#19A98E]">{formatWon(summary.expectedEarnings)}</div>
          </div>
          <div className="rounded-[2rem] bg-white p-6 ring-1 ring-[#E3EFEC] shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <div className="text-sm font-black text-[#718A87]">지급 완료</div>
            <div className="mt-2 text-4xl font-black">{formatWon(summary.paidEarnings)}</div>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          {earnings.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center font-black text-[#607D79] ring-1 ring-[#E3EFEC]">
              아직 정산 내역이 없습니다.
            </div>
          ) : (
            earnings.map((earning) => (
              <div key={earning.id} className="rounded-[2rem] bg-white p-6 ring-1 ring-[#E3EFEC] shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
                <div className="text-xl font-black">{earning.earning_title}</div>
                <p className="mt-2 text-sm font-bold text-[#607D79]">
                  {formatWon(earning.amount)} · {earning.earning_status} · 지급예정일 {earning.payout_due_date || '미정'}
                </p>
              </div>
            ))
          )}
        </section>

        <div className="mt-6">
          <Link href="/manager" className="block rounded-3xl bg-[#19B99A] px-6 py-5 text-center text-xl font-black text-white">
            매니저앱으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  )
}
