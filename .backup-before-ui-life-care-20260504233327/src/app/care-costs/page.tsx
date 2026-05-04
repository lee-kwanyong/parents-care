import Link from 'next/link'
import { CostApprovalBoard } from '@/components/CostApprovalBoard'

export default function CareCostsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">추가비용 사전승인</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          추가비용은
          <br />
          먼저 확인받고 진행합니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          택시비, 서류 발급비, 식사 배송비, 추가 동행시간, 제휴 이동비처럼 보호자가 불안할 수 있는 비용은
          승인 후에만 진행합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/child/costs" className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
            자녀 비용 확인
          </Link>
          <Link href="/ops/costs" className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
            운영실 비용 보드
          </Link>
        </div>

        <div className="mt-8">
          <CostApprovalBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
