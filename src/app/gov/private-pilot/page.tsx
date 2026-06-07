import { PrivatePilotPanel } from '@/components/ops/PrivatePilotPanel'

export const metadata = {
  title: '자체 예비 실증 현황 | 안부웍스',
  description: '안부웍스 자체 예비 실증의 참여 가구, 안부 신호, 긴급 요청, 미니 리포트를 확인합니다.'
}

export default function GovPrivatePilotPage() {
  return (
    <PrivatePilotPanel
      title="자체 예비 실증 현황"
      subtitle="지자체 제안 전 실제 작동 증거를 만들기 위한 소규모 예비 실증 현황입니다."
    />
  )
}
