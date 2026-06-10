import { Suspense } from 'react'
import { OnboardingStartPanel } from '@/components/onboarding/OnboardingStartPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '가입 후 시작하기 | 안부웍스',
  description: '보호자, 부모님, 생활확인 파트너, 운영실 역할별로 가입 후 해야 할 일을 안내합니다.'
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">가입 후 시작 화면을 불러오는 중입니다.</main>}>
      <OnboardingStartPanel />
    </Suspense>
  )
}
