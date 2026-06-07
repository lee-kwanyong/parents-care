import { OpsControlCenterPanel } from '@/components/ops/OpsControlCenterPanel'

export const metadata = {
  title: '운영실 자동운영 상태판 | 안부웍스',
  description: 'Heartbeat, 오토파일럿, 긴급 사건, 문자 대기열, 요양보호사 가용 상태를 한 화면에서 확인합니다.'
}

export default function OpsControlCenterPage() {
  return <OpsControlCenterPanel />
}
