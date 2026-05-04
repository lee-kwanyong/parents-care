import Link from 'next/link'
import { CareFileBoard } from '@/components/CareFileBoard'

export default function OpsFilesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              파일 운영 보드
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              사진·카톡 접수, 약 봉투, 영수증, 처방전, 검사결과지 파일을 확인합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/ops/intake-inbox" className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
              사진·카톡 접수함
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <CareFileBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
