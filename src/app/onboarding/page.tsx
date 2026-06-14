import { FamilyInviteFlowPanel } from '@/components/onboarding/FamilyInviteFlowPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '시작하기 | 안부웍스',
  description: '가족코드와 초대 링크로 부모님 안부 흐름을 시작합니다.'
}

export default function OnboardingPage() {
  return <FamilyInviteFlowPanel mode="onboarding" />
}
