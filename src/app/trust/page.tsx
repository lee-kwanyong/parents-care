import { AppFrame } from '@/components/ui/AppFrame'
import { TrustSafetyGuide } from '@/components/TrustSafetyGuide'

export default function TrustPage() {
  return (
    <AppFrame title="신뢰 기준" subtitle="케어파트너 검증과 보호자 리포트 기준">
      <TrustSafetyGuide />
    </AppFrame>
  )
}
