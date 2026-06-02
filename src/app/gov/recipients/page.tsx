import { GovPlatformPanel } from '@/components/gov/GovPlatformPanel'

export const metadata = {
  title: '대상자 관리 | 안부웍스 지자체 운영실',
  description: '통합돌봄 실증 대상자를 관리합니다.'
}

export default function GovRecipientsPage() {
  return <GovPlatformPanel initialTab="recipients" />
}
