import { GovPilotManualPanel } from '@/components/gov/GovPilotManualPanel'

export const metadata = {
  title: '운영실 실증 운영 매뉴얼 | 안부웍스',
  description: '운영실이 실증 운영 단계와 교육 기록을 관리합니다.'
}

export default function OpsPilotManualPage() {
  return (
    <GovPilotManualPanel
      title="운영실 실증 운영 매뉴얼"
      subtitle="운영실 기준으로 실증 단계별 체크리스트, 교육 기록, 제출 준비 흐름을 관리합니다."
    />
  )
}
