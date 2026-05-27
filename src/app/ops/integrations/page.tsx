import { AnbuIntegrationOps } from '@/components/AnbuIntegrationOps'

export const metadata = {
  title: '외부연동 설정 | 안부웍스',
  description: 'SMS, 카카오 알림톡, 결제, Cron 연동 상태를 확인합니다.'
}

export default function OpsIntegrationsPage() {
  return <AnbuIntegrationOps />
}
