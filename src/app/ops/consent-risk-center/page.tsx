import { ConsentRiskCenterPanel } from '@/components/ops/ConsentRiskCenterPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '개인정보·동의·책임범위 센터 | 안부웍스 운영실',
  description: '실증 참여 동의, 비의료 고지, 개인정보 수집 범위, 생활확인 파트너 책임범위를 관리합니다.'
}

export default function OpsConsentRiskCenterPage() {
  return <ConsentRiskCenterPanel />
}
