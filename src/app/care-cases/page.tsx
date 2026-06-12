import Link from 'next/link'
import { CareCaseBoard } from '@/components/CareCaseBoard'

export default function CareCasesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">통합 케어 케이스</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          흩어진 기능을
          <br />
          하나의 부모님 케이스로 묶습니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#63807C]">
          안심케어 접수, 사진 접수, 케어패스포트, 식사, 약, 서류, 정기진료, 퇴원, 매니저, 비용승인, 30초 요약을
          한 케이스에서 확인합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/child/cases" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
            자녀 케이스 보기
          </Link>
          <Link href="/admin/ops/cases" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
            운영실 케이스 보드
          </Link>
        </div>

        <div className="mt-8">
          <CareCaseBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
