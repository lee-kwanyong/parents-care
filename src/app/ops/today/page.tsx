import Link from 'next/link'
import { TodayReassuranceBoard } from '@/components/TodayReassuranceBoard'

export default function OpsTodayPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">통합 오늘의 안심판</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              모든 모듈의 긴급, 확인 필요, 완료 신호를 하나로 모아 운영실 우선순위를 잡습니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/ops/cases" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
              통합 케이스
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <TodayReassuranceBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
