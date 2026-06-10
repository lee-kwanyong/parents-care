import { Suspense } from 'react'
import { OnboardingStartPanel } from '@/components/onboarding/OnboardingStartPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '안부웍스 시작하기 | 안부웍스',
  description: '역할별로 안부웍스를 시작하는 3단계 안내 화면입니다.'
}

export default function PortalPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">시작 화면을 불러오는 중입니다.</main>}>
      <OnboardingStartPanel />
    </Suspense>
  )
}
