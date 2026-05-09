import Link from 'next/link'
import { CommunicationCareBoard } from '@/components/CommunicationCareBoard'

export default function ChildSummariesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">자녀앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              30초 요약 리포트
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              긴 리포트 대신 오늘 부모님 상태와 가족 할 일만 빠르게 확인합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-comfort" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
              연락·요약 보기
            </Link>
            <Link href="/child" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              자녀 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <CommunicationCareBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
