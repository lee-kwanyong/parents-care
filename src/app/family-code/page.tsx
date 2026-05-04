import Link from 'next/link'
import { FamilySharingBoard } from '@/components/FamilySharingBoard'

export default function FamilyCodePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">가족 공동조회 코드</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          가족이 함께
          <br />
          부모님 상태를 확인합니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          대표 보호자가 가족 공간을 만들고 공동조회 코드를 공유하면, 다른 가족도 오늘의 안심판과 가족 할 일을 함께 볼 수 있습니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/child/family" className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
            자녀 가족 관리
          </Link>
          <Link href="/ops/families" className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
            운영실 가족 보드
          </Link>
        </div>

        <div className="mt-8">
          <FamilySharingBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
