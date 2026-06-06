import { NotificationSetupPanel } from '@/components/NotificationSetupPanel'

export const metadata = {
  title: '알림 설정 | 안부웍스',
  description: '안부웍스 SMS, 앱 알림, 카카오 알림톡 설정'
}

export default function NotificationSetupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)]">
      <NotificationSetupPanel />
    </main>
  )
}
