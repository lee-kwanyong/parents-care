import { ResponseEscalationPanel } from '@/components/ops/ResponseEscalationPanel'

export const metadata = {
  title: '자동 에스컬레이션 | 안부웍스 운영실',
  description: '후속조치 요청이 방치되지 않도록 운영실 재알림과 수동 연결 필요 상태를 관리합니다.'
}

export default function OpsResponseEscalationPage() {
  return <ResponseEscalationPanel />
}
