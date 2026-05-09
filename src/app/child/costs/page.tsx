import Link from 'next/link'
import { CostApprovalBoard } from '@/components/CostApprovalBoard'

export default function ChildCostsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">자녀앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              비용 승인 확인
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              추가 비용은 보호자가 승인한 뒤에만 진행됩니다.
            </p>
          </div>

          <Link href="/child" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
            자녀 홈
          </Link>
        </div>

        <div className="mt-8">
          <CostApprovalBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
