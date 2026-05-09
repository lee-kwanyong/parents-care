import Link from 'next/link'
import { CommunicationCareBoard } from '@/components/CommunicationCareBoard'

export default function OpsContactCenterPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              연락센터
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              사전 안심전화, 케어플랜 설명, 30초 요약, 식사·약·퇴원 후 확인 연락을 관리합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-comfort" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
              가족 화면
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <CommunicationCareBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
