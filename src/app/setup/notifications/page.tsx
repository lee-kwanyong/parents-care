import { NotificationSetupPanel } from '@/components/NotificationSetupPanel'

export const metadata = {
  title: '알림 설정 | 안부웍스',
  description: '안부웍스 SMS, 앱 알림, 카카오 알림톡 설정'
}

export default function NotificationSetupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <NotificationSetupPanel />
    </main>
  )
}
