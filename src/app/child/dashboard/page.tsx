import { ChildCareReportPanel } from '@/components/child/ChildCareReportPanel'

export const metadata = {
  title: '부모님 케어 | 부모님 안심케어',
  description: '자녀가 부모님의 식사, 복약, 몸 상태를 데이터 리포트로 확인합니다.'
}

export default function ChildDashboardPage() {
  return <ChildCareReportPanel />
}
