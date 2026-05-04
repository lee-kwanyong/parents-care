import Link from 'next/link'
import { CostApprovalBoard } from '@/components/CostApprovalBoard'

export default function OpsCostsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              추가비용 사전승인 보드
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              택시비, 서류 발급비, 식사 배송비, 추가 동행시간은 보호자 승인 후 진행합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-costs" className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
              가족 화면
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <CostApprovalBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
