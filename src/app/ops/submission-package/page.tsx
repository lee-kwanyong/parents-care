import { GovSubmissionPackagePanel } from '@/components/gov/GovSubmissionPackagePanel'

export const metadata = {
  title: '운영실 제출 패키지 | 안부웍스',
  description: '운영실에서 지자체 제출용 자료 묶음을 생성합니다.'
}

export default function OpsSubmissionPackagePage() {
  return (
    <GovSubmissionPackagePanel
      title="운영실 제출 패키지"
      subtitle="운영실 기준으로 대상자, 보고서, 사건 이력, 알림, 개인정보 감사 자료를 한 번에 묶습니다."
    />
  )
}
