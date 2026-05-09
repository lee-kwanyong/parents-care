import Link from 'next/link'
import { CommunicationCareBoard } from '@/components/CommunicationCareBoard'

export default function CareComfortPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">사전 안심전화·30초 요약</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          앱을 잘 못 써도
          <br />
          전화와 요약으로 안심할 수 있게 합니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#63807C]">
          보호자는 긴 리포트를 읽지 않아도 됩니다. 운영실이 사전 안심전화와 30초 요약으로
          부모님 상태, 가족 할 일, 확인 필요한 항목만 쉽게 정리합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/ops/contact-center" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
            운영실 연락센터
          </Link>
          <Link href="/child/summaries" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
            자녀 요약 보기
          </Link>
        </div>

        <div className="mt-8">
          <CommunicationCareBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
