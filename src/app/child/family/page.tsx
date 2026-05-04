import Link from 'next/link'
import { FamilySharingBoard } from '@/components/FamilySharingBoard'

export default function ChildFamilyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">자녀앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              가족 공동조회
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              형제자매와 배우자가 부모님 오늘 상태, 케이스, 가족 할 일을 함께 볼 수 있게 초대합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/child" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              자녀 홈
            </Link>
            <Link href="/child/tasks" className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
              가족 할 일
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <FamilySharingBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
