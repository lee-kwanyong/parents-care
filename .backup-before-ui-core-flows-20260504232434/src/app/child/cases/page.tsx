import Link from 'next/link'
import { CareCaseBoard } from '@/components/CareCaseBoard'

export default function ChildCasesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">자녀앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              부모님 케이스
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              오늘 부모님 걱정이 어디까지 진행됐는지 한 번에 확인합니다.
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
          <CareCaseBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
