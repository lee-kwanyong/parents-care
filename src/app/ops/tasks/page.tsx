import Link from 'next/link'
import { FamilyTaskBoard } from '@/components/FamilyTaskBoard'

export default function OpsTasksPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              가족 할 일 운영 보드
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              식사 미확인, 약 미확인, 도움 요청, 케어플랜 액션을 가족 할 일로 만들고 처리 상태를 확인합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/admin/ops/daily-care" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
              일상 케어 관제
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <FamilyTaskBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
