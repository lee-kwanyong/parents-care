import { MetricsDashboardPage } from '@/components/AnbuFullBuildout'

export const metadata = {
  title: '핵심 지표 | 안부웍스',
  description: '보호자, 부모님, 안부 응답률, 케어파트너 신청 지표를 확인합니다.'
}

export default function MetricsRoute() {
  return <MetricsDashboardPage />
}
