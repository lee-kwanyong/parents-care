import { GuardianParentCareDashboard } from '@/components/guardian/GuardianParentCareDashboard'

export const metadata = {
  title: '보호자 부모님 케어 | 부모님 안심케어',
  description: '보호자가 부모님의 식사, 복약, 몸 상태, 도움 요청을 확인합니다.'
}

export default function ChildDashboardPage() {
  return <GuardianParentCareDashboard />
}
