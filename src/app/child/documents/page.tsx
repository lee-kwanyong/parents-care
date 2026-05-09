import Link from 'next/link'
import { DocumentRequestBoard } from '@/components/DocumentRequestBoard'

export default function ChildDocumentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">자녀앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              보험서류·영수증 확인
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              병원 다녀온 뒤 필요한 영수증, 세부내역서, 처방전, 통원확인서를 확인합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-documents" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
              서류 요청
            </Link>
            <Link href="/child" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              자녀 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <DocumentRequestBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
