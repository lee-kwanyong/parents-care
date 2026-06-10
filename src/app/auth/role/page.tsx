import { Suspense } from 'react'
import { AuthRoleOnboardingPanel } from '@/components/auth/AuthRoleOnboardingPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '역할 선택 | 안부웍스',
  description: '회원가입 후 보호자, 부모님, 생활확인 파트너, 운영실 역할을 저장합니다.'
}

export default function AuthRolePage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">역할 선택 화면을 불러오는 중입니다.</main>}>
      <AuthRoleOnboardingPanel />
    </Suspense>
  )
}
