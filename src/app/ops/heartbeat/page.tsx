import { OpsHeartbeatPanel } from '@/components/ops/OpsHeartbeatPanel'

export const metadata = {
  title: '운영실 자동운영 Heartbeat | 안부웍스',
  description: '오토파일럿, 에스컬레이션, 문자 대기열을 주기적으로 점검합니다.'
}

export default function OpsHeartbeatPage() {
  return <OpsHeartbeatPanel />
}
