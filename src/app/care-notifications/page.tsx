import Link from 'next/link'
import { NotificationQueueBoard } from '@/components/NotificationQueueBoard'

export default function CareNotificationsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">알림 큐</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          필요한 알림을
          <br />
          먼저 대기열에 쌓습니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#63807C]">
          카카오 알림톡, 문자, 앱 알림은 배포 직전에 실제 발송 API를 붙입니다. 지금은 누가 어떤 알림을 받아야 하는지 먼저 저장합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/child/notifications" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
            자녀 알림함
          </Link>
          <Link href="/ops/notifications" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
            운영실 알림 큐
          </Link>
        </div>

        <div className="mt-8">
          <NotificationQueueBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
