import { GuardianThreeSecondPanel } from '@/components/guardian/GuardianThreeSecondPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '보호자 3초 안부 | 안부웍스',
  description: '부모님의 현재 상태, 데이터 신뢰도, 지금 할 일을 3초 안에 확인합니다.'
}

export default function ChildDashboardPage() {
  return <GuardianThreeSecondPanel />
}
