import { PilotQaScriptPanel } from '@/components/ops/PilotQaScriptPanel'

export const metadata = {
  title: '지자체 실증 QA·시연 스크립트 | 안부웍스',
  description: '지자체 담당자에게 보여줄 실증 점검표와 시연 흐름을 관리합니다.'
}

export default function GovPilotQaPage() {
  return (
    <PilotQaScriptPanel
      title="지자체 실증 QA·시연 스크립트"
      subtitle="지자체 담당자 앞에서 보여줄 실증 준비 상태와 15분 시연 순서를 확인합니다."
    />
  )
}
