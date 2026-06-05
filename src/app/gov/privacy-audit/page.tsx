import { PrivacyAuditPanel } from '@/components/ops/PrivacyAuditPanel'

export const metadata = {
  title: '지자체 개인정보 열람 감사 | 안부웍스',
  description: '지자체 실증과 공공 제출용 개인정보 동의·열람 로그를 확인합니다.'
}

export default function GovPrivacyAuditPage() {
  return (
    <PrivacyAuditPanel
      title="지자체 개인정보 열람 감사"
      subtitle="지자체 실증 대상자의 동의 상태와 운영실·도움망·지자체 열람 기록을 감사 자료로 확인합니다."
    />
  )
}
