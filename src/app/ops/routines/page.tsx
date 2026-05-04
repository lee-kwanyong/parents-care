import Link from 'next/link'
import { RecurringCareBoard } from '@/components/RecurringCareBoard'

export default function OpsRoutinesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              정기진료 운영 보드
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              다음 예약 후보, 예약 요청, 예약 완료 상태를 관리합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-routines" className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
              정기 케어 등록
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <RecurringCareBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
