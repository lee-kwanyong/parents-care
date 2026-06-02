import { GovPlatformPanel } from '@/components/gov/GovPlatformPanel'

export const metadata = {
  title: '감사로그 | 안부웍스 지자체 운영실',
  description: '접근·처리 이력을 확인합니다.'
}

export default function GovAuditPage() {
  return <GovPlatformPanel initialTab="audit" />
}
