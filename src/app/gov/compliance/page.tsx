import { GovCompliancePanel } from '@/components/gov/GovCompliancePanel'

export const metadata = {
  title: '공공 제출 컴플라이언스 | 안부웍스',
  description: '지자체 제출 전 개인정보 최소수집과 고령친화 UI 점검 기록을 남깁니다.'
}

export default function GovCompliancePage() {
  return <GovCompliancePanel />
}
