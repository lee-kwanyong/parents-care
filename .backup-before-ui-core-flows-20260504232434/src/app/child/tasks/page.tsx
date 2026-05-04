import Link from 'next/link'
import { FamilyTaskBoard } from '@/components/FamilyTaskBoard'

export default function ChildTasksPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">자녀앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              가족 할 일
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              식사, 약, 서류, 다음 예약, 사회공헌 연결처럼 가족이 해야 할 일을 3개 이하로 쉽게 정리합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/child/daily-care" className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
              밥·약 확인
            </Link>
            <Link href="/child" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              자녀 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <FamilyTaskBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
