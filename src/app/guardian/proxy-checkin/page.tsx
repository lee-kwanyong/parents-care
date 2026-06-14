import { GuardianProxyCheckinPanel } from '@/components/guardian/GuardianProxyCheckinPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '보호자 대리입력 | 안부웍스',
  description: '보호자가 전화 확인 후 부모님의 오늘 안부 상태를 대신 기록합니다.'
}

export default function GuardianProxyCheckinPage() {
  return <GuardianProxyCheckinPanel />
}
