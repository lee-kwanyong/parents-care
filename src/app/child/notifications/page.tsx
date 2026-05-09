import Link from 'next/link'
import { NotificationQueueBoard } from '@/components/NotificationQueueBoard'

export default function ChildNotificationsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">자녀앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              알림함
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              식사·약 확인, 비용 승인, 매니저 배정, 30초 요약 알림을 확인합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/child" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              자녀 홈
            </Link>
            <Link href="/child/today" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
              오늘의 안심판
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <NotificationQueueBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
