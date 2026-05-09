import Link from 'next/link'
import { ManagerFieldConsole } from '@/components/ManagerFieldConsole'

export default function ManagerTodayPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">동행매니저앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              오늘 배정 일정
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              만남 암호, 케어패스포트, 알러지, 복용약, 이동 정책, 서류와 리포트를 현장에서 확인합니다.
            </p>
          </div>

          <Link href="/manager" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
            매니저 홈
          </Link>
        </div>

        <div className="mt-8">
          <ManagerFieldConsole mode="manager" />
        </div>
      </section>
    </main>
  )
}
