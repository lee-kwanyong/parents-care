import { GovPlatformPanel } from '@/components/gov/GovPlatformPanel'

export const metadata = {
  title: '지자체 실증 운영실 | 안부웍스',
  description: 'ICT 안부확인 데이터를 통합돌봄 운영 지표로 확인합니다.'
}

export default function GovDashboardPage() {
  return <GovPlatformPanel initialTab="dashboard" />
}
