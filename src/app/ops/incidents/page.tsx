import { OpsIncidentsPanel } from '@/components/ops/OpsIncidentsPanel'

export const metadata = {
  title: '운영실 사건 타임라인 | 안부웍스',
  description: '부모님 신호, 문자, 도움망, 통화, 배정, 완료 기록을 사건별로 통합합니다.'
}

export default function OpsIncidentsPage() {
  return <OpsIncidentsPanel />
}
