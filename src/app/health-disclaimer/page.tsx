import { LegalPage } from '@/components/AnbuFullBuildout'

export const metadata = {
  title: '건강정보 고지 | 안부웍스',
  description: '안부온은 의료 진단이 아니라 안부 확인 참고 신호입니다.'
}

export default function HealthDisclaimerRoute() {
  return <LegalPage type="health" />
}
