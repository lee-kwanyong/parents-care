import Link from 'next/link'
import { DocumentRequestBoard } from '@/components/DocumentRequestBoard'

export default function OpsDocumentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              서류·영수증 운영 보드
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              실손보험, 가족 확인, 다음 병원 제출에 필요한 서류의 준비·수령·전달 상태를 관리합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-documents" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
              서류 요청 만들기
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <DocumentRequestBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
