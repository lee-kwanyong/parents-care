import { Suspense } from 'react'
import { GuardianTodayReportPanel } from '@/components/guardian/GuardianTodayReportPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '자녀·보호자 오늘 리포트 | 안부웍스',
  description: '부모님 안부 신호, 문자 알림, 다음 할 일을 한 화면에서 확인합니다.'
}

export default function PortalChildPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">보호자 리포트를 불러오는 중입니다.</main>}>
      <GuardianTodayReportPanel />
    </Suspense>
  )
}
