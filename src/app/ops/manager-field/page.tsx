import Link from 'next/link'
import { ManagerFieldConsole } from '@/components/ManagerFieldConsole'

export default function OpsManagerFieldPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              매니저 현장 운영 보드
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              부모님 상태, 차량 정책, 현장 체크리스트, 단계별 진행상태, 보호자 리포트 초안을 관리합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/manager/today" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
              매니저 화면
            </Link>
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <ManagerFieldConsole mode="ops" />
        </div>
      </section>
    </main>
  )
}
