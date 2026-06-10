import { Suspense } from 'react'
import { PilotConsentPanel } from '@/components/public/PilotConsentPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '실증 참여 동의 | 안부웍스',
  description: '안부웍스 자체 예비실증 참여 전 개인정보 수집, 비의료 고지, 응급상황 안내를 확인합니다.'
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">동의서를 불러오는 중입니다.</main>}>
      <PilotConsentPanel />
    </Suspense>
  )
}
