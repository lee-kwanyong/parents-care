import { ChildCareReportPanel } from '@/components/child/ChildCareReportPanel'

export const metadata = {
  title: '안부온 | 부모님 안심케어',
  description: '자녀가 부모님의 최근 상태 리포트를 확인합니다.'
}

export default function ChildSafetyLoopPage() {
  return <ChildCareReportPanel />
}
