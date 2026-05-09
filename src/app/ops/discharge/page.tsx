import Link from 'next/link'
import { DischargeCareBoard } from '@/components/DischargeCareBoard'

export default function OpsDischargePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              퇴원 후 7일 운영 보드
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              퇴원 직후 약, 식사, 통증, 다음 외래, 낙상 위험을 7일 동안 확인합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-discharge" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
              안심팩 만들기
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <DischargeCareBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
