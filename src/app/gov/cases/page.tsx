import { OpsIncidentsPanel } from '@/components/ops/OpsIncidentsPanel'

export const metadata = {
  title: '지자체 사건 처리 이력 | 안부웍스',
  description: '지자체 제출용 사건별 처리 타임라인을 확인합니다.'
}

export default function GovCasesPage() {
  return (
    <OpsIncidentsPanel
      title="지자체 사건 처리 이력"
      subtitle="위험 신호가 발생한 뒤 보호자 알림, 도움망 요청, 통화, 배정, 완료까지의 처리 증적을 확인합니다."
    />
  )
}
