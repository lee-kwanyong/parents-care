import { GovPlatformPanel } from '@/components/gov/GovPlatformPanel'

export const metadata = {
  title: '사례관리 | 안부웍스 지자체 운영실',
  description: '전화 확인, 가족 확인 요청, 방문 필요 등 사례관리 기록을 남깁니다.'
}

export default function GovCasesPage() {
  return <GovPlatformPanel initialTab="cases" />
}
