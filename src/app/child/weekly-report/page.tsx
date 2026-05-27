import { AnbuReportSubscriptionFrame } from '@/components/AnbuReportSubscriptionFrame'

export const metadata = {
  title: '주간 돌봄 리포트 | 안부웍스',
  description: '구독 상태에 따라 주간 돌봄 리포트를 확인합니다.'
}

export default function WeeklyReportPage() {
  return <AnbuReportSubscriptionFrame />
}
