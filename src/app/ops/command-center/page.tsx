import Link from 'next/link'
import { OpsCommandCenterBoard } from '@/components/OpsCommandCenterBoard'

export default function OpsCommandCenterPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              통합 관제 보드
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              긴급, 확인 필요, 진행 중, 완료를 한 화면에서 확인합니다.
            </p>
          </div>

          <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
            운영실 홈
          </Link>
        </div>

        <div className="mt-8">
          <OpsCommandCenterBoard />
        </div>
      </section>
    </main>
  )
}
