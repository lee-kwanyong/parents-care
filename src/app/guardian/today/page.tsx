import { Suspense } from 'react'
import { GuardianTodayReportPanel } from '@/components/guardian/GuardianTodayReportPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '오늘 부모님 상태 | 안부웍스',
  description: '가족코드로 오늘 부모님 안부 리포트를 확인합니다.'
}

export default function GuardianTodayPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">오늘 리포트를 불러오는 중입니다.</main>}>
      <GuardianTodayReportPanel />
    </Suspense>
  )
}
