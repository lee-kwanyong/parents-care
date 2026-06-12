import { Suspense } from 'react'
import { GuardianRingReportPanel } from '@/components/public/GuardianRingReportPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '스마트링 안부리듬 리포트 | 안부웍스',
  description: '보호자가 부모님의 스마트링 안부리듬 리포트를 확인합니다.'
}

export default function GuardianRingReportPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">스마트링 리포트를 불러오는 중입니다.</main>}>
      <GuardianRingReportPanel />
    </Suspense>
  )
}
