import { SubscriptionStatusPanel } from '@/components/SubscriptionStatusPanel'

export const metadata = {
  title: '구독상태 | 안부웍스',
  description: '안부웍스 현재 플랜과 기능 제한 확인'
}

export default function SubscriptionPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <SubscriptionStatusPanel />
    </main>
  )
}
