import { AppFrame } from '@/components/ui/AppFrame'
import { PricingGuide } from '@/components/PricingGuide'

export default function PricingPage() {
  return (
    <AppFrame title="금액 안내" subtitle="부모님 안심케어 이용 금액과 포함 범위">
      <PricingGuide />
    </AppFrame>
  )
}
