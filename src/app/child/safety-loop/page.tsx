import { ChildCareReportPanel } from '@/components/child/ChildCareReportPanel'

export const metadata = {
  title: '안부온 | 부모님 안심케어',
  description: '자녀가 부모님의 아침·점심·저녁 식사와 복약 상태를 확인합니다.'
}

export default function ChildSafetyLoopPage() {
  return <ChildCareReportPanel />
}
