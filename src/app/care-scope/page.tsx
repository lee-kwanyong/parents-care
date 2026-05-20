import { AppFrame } from '@/components/ui/AppFrame'
import { CareScopeGuide } from '@/components/CareScopeGuide'

export default function CareScopePage() {
  return (
    <AppFrame title="케어 범위" subtitle="포함되는 일과 포함되지 않는 일을 먼저 확인하세요">
      <CareScopeGuide />
    </AppFrame>
  )
}
