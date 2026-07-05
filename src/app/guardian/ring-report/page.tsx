import { GuardianRingReportPanel } from '@/components/guardian/GuardianRingReportPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '안부완료 리포트 | 안부웍스',
  description: '스마트링 데이터를 보호자가 이해하기 쉬운 비의료 안부 참고 리포트로 확인합니다.'
}

export default function GuardianRingReportPage() {
  return <GuardianRingReportPanel />
}
