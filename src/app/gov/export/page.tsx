import { GovPlatformPanel } from '@/components/gov/GovPlatformPanel'

export const metadata = {
  title: '내보내기 | 안부웍스 지자체 운영실',
  description: '대상자와 성과 데이터를 CSV/PDF로 내보냅니다.'
}

export default function GovExportPage() {
  return <GovPlatformPanel initialTab="export" />
}
