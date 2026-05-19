import Link from 'next/link'
import { CareCaseBoard } from '@/components/CareCaseBoard'

export default function OpsCasesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              통합 케어 케이스 보드
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              안심케어 접수, 매니저 현장, 식사, 약, 서류, 정기진료, 퇴원, 사회공헌, 비용승인을 하나의 케이스로 묶습니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/ops/worry-center" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
              걱정센터
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <CareCaseBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
