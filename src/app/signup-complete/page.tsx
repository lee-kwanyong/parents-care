import { Suspense } from 'react'
import { AuthRoleOnboardingPanel } from '@/components/auth/AuthRoleOnboardingPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '회원가입 완료 | 안부웍스',
  description: '회원가입 후 역할을 저장하고 다음 화면으로 이동합니다.'
}

export default function SignupCompletePage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">회원가입 완료 화면을 불러오는 중입니다.</main>}>
      <AuthRoleOnboardingPanel />
    </Suspense>
  )
}
