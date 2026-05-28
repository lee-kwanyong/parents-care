import { AnbuAuditLogPage } from '@/components/AnbuAuditLog'

export const metadata = {
  title: '감사 로그 | 안부웍스 운영실',
  description: '운영실 접근과 주요 작업 기록을 확인합니다.'
}

export default function OpsAuditPage() {
  return <AnbuAuditLogPage />
}
