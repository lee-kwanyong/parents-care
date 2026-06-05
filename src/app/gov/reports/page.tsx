import { GovReportsPanel } from '@/components/gov/GovReportsPanel'

export const metadata = {
  title: '지자체 운영보고서 | 안부웍스',
  description: '실증 대상자, 안부 신호, 후속조치, 도움망, 문자 발송, 자동운영 기록을 지자체 제출용으로 집계합니다.'
}

export default function GovReportsPage() {
  return <GovReportsPanel />
}
