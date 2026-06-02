import { GovPlatformPanel } from '@/components/gov/GovPlatformPanel'

export const metadata = {
  title: '성과보고 | 안부웍스 지자체 운영실',
  description: '실증 성과지표와 월간 리포트 초안을 확인합니다.'
}

export default function GovReportsPage() {
  return <GovPlatformPanel initialTab="reports" />
}
