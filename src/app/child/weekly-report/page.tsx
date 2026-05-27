import { AnbuWeeklyReport } from '@/components/AnbuWeeklyReport'

export const metadata = {
  title: '주간 돌봄 리포트 | 안부웍스',
  description: '최근 7일 부모님 안부 기록을 실제 데이터 기반으로 요약합니다.'
}

export default function WeeklyReportPage() {
  return <AnbuWeeklyReport />
}
