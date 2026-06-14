import { FamilyInviteFlowPanel } from '@/components/onboarding/FamilyInviteFlowPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '초대 링크 | 안부웍스',
  description: '가족코드 초대 링크로 부모님과 보호자를 연결합니다.'
}

export default function InvitePage() {
  return <FamilyInviteFlowPanel mode="invite" />
}
