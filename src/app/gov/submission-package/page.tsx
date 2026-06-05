import { GovSubmissionPackagePanel } from '@/components/gov/GovSubmissionPackagePanel'

export const metadata = {
  title: '지자체 제출 패키지 | 안부웍스',
  description: '대상자 현황, 운영보고서, 사건 이력, 알림 기록, 개인정보 감사 로그를 제출 묶음으로 생성합니다.'
}

export default function GovSubmissionPackagePage() {
  return <GovSubmissionPackagePanel />
}
