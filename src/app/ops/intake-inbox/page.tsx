import Link from 'next/link'
import { AssistedIntakeBoard } from '@/components/AssistedIntakeBoard'

export default function OpsIntakeInboxPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              사진·카톡 간편 접수함
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              보호자가 올린 예약 문자, 카톡 캡처, 약 봉투, 영수증, 서류 사진을 확인하고 케어 요청으로 변환합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-intake" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
              테스트 접수
            </Link>
            <Link href="/ops/worry-center" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
              걱정센터
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <AssistedIntakeBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
