import { GuardianParentCareDashboard } from '@/components/guardian/GuardianParentCareDashboard'

export const metadata = {
  title: '보호자 부모님 케어 | 부모님 안심케어',
  description: '부모님 안부 신호를 보호자가 한 화면에서 확인합니다.'
}

export default function ChildSafetyLoopPage() {
  return <GuardianParentCareDashboard />
}
