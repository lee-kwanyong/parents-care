import { OpsHouseholdsPanel } from '@/components/ops/OpsHouseholdsPanel'

export const metadata = {
  title: '지자체 대상자 관리 | 안부웍스',
  description: '지자체 실증 대상자와 위험군 분류를 관리합니다.'
}

export default function GovRecipientsPage() {
  return (
    <OpsHouseholdsPanel
      title="지자체 대상자 관리"
      subtitle="A그룹 고위험 취약 노인과 B그룹 일반 관리 노인을 분류하고, 권역·동의·최근 사건 상태를 관리합니다."
    />
  )
}
