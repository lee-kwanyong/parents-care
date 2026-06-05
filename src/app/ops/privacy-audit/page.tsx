import { PrivacyAuditPanel } from '@/components/ops/PrivacyAuditPanel'

export const metadata = {
  title: '개인정보 동의·열람 감사센터 | 안부웍스 운영실',
  description: '대상자 동의 상태와 개인정보 열람 기록을 관리합니다.'
}

export default function OpsPrivacyAuditPage() {
  return <PrivacyAuditPanel />
}
