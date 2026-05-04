import Link from 'next/link'
import { MealCareBoard } from '@/components/MealCareBoard'

export default function OpsMealsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              안심밥상 운영 보드
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              식사 미확인, 배송 실패, 회복식, 저염식, 당뇨식, 사회공헌 식사 연결을 관리합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-meals" className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
              안심밥상 요청 만들기
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <MealCareBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
