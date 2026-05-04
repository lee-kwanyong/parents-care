import Link from 'next/link'
import { AssistedIntakeBoard } from '@/components/AssistedIntakeBoard'

export default function ChildIntakeInboxPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">자녀앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              사진·카톡 접수함
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              병원 예약 문자, 약 봉투, 영수증, 카톡 캡처를 운영실이 정리하는 상태를 확인합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-intake" className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
              사진·카톡으로 맡기기
            </Link>
            <Link href="/child" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              자녀 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <AssistedIntakeBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
