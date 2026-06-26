import { Suspense } from 'react'
import { GuardianCompletionCarePanel } from '@/components/guardian/GuardianCompletionCarePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '안부완료 리포트 | 안부웍스',
  description: '확인필요 상황을 담당자 지정, 실제 확인, 완료 리포트까지 관리합니다.'
}

export default function ChildDashboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">안부완료 리포트를 불러오는 중입니다.</main>}>
      <GuardianCompletionCarePanel />
    </Suspense>
  )
}
