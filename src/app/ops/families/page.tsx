import Link from 'next/link'
import { FamilySharingBoard } from '@/components/FamilySharingBoard'

export default function OpsFamiliesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              가족 공동조회 운영
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              가족 공간, 초대 코드, 비용 승인자, 가족 할 일 담당자 권한을 확인합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
            <Link href="/ops/command-center" className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
              통합 관제
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <FamilySharingBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
