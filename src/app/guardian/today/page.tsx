import { Suspense } from 'react'
import { GuardianCompletionCarePanel } from '@/components/guardian/GuardianCompletionCarePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '보호자 안부완료 리포트 | 안부웍스',
  description: '부모님 안부 확인이 실제 완료됐는지 리포트로 확인합니다.'
}

export default function GuardianTodayPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">보호자 리포트를 불러오는 중입니다.</main>}>
      <GuardianCompletionCarePanel />
    </Suspense>
  )
}
