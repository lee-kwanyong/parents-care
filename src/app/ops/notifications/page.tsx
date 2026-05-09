import Link from 'next/link'
import { NotificationQueueBoard } from '@/components/NotificationQueueBoard'

export default function OpsNotificationsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              알림 큐 운영
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              카카오 알림톡, 문자, 앱 알림을 실제 연동하기 전 대기열을 관리합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/ops" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              운영실 홈
            </Link>
            <Link href="/ops/command-center" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
              통합 관제
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <NotificationQueueBoard mode="ops" />
        </div>
      </section>
    </main>
  )
}
