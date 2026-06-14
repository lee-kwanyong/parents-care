import { GuardianTodayReportPanel } from '@/components/guardian/GuardianTodayReportPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '보호자 오늘 리포트 | 안부웍스',
  description: '보호자가 부모님의 오늘 안부 상태와 다음 할 일을 확인합니다.'
}

export default function GuardianTodayPage() {
  return <GuardianTodayReportPanel />
}
