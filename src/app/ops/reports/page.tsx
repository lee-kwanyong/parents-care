import { GovReportsPanel } from '@/components/gov/GovReportsPanel'

export const metadata = {
  title: '운영실 운영보고서 | 안부웍스',
  description: '운영실 자동운영, 후속조치, 도움망, 문자 발송 성과를 집계합니다.'
}

export default function OpsReportsPage() {
  return (
    <GovReportsPanel
      title="운영실 운영보고서"
      subtitle="운영실 자동운영, 후속조치, 도움망 요청, 문자 발송 성과를 주간·월간 보고서로 집계합니다."
    />
  )
}
