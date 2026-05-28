import { AnbuOpsDashboard } from '@/components/AnbuOpsDashboard'

export const metadata = {
  title: '운영실 통합 대시보드 | 안부웍스',
  description: '안부 위험신호, 케어 요청, 파트너, 리포트, 알림 발송함을 한 화면에서 확인합니다.'
}

export default function OpsDashboardPage() {
  return <AnbuOpsDashboard />
}
