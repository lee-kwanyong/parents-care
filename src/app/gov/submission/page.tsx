import { GovSubmissionPackagePanel } from '@/components/gov/GovSubmissionPackagePanel'

export const metadata = {
  title: '지자체 제출 패키지 | 안부웍스',
  description: '지자체 지원사업·R&D 제출용 제안서, 실증계획, KPI, 보안체크리스트를 생성합니다.'
}

export default function GovSubmissionPage() {
  return <GovSubmissionPackagePanel />
}
