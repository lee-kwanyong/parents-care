import { Suspense } from 'react'
import { GuardianTodayReportPanel } from '@/components/guardian/GuardianTodayReportPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '보호자 대시보드 | 안부웍스',
  description: '부모님 안부 신호와 보호자 알림 기록을 확인합니다.'
}

export default function ChildDashboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">보호자 대시보드를 불러오는 중입니다.</main>}>
      <GuardianTodayReportPanel />
    </Suspense>
  )
}
