import { GovDemoRunnerPanel } from '@/components/gov/GovDemoRunnerPanel'

export const metadata = {
  title: '운영실 실증 시연 모드 | 안부웍스',
  description: '운영실에서 지자체 시연용 전체 흐름을 생성합니다.'
}

export default function OpsDemoRunnerPage() {
  return (
    <GovDemoRunnerPanel
      title="운영실 실증 시연 모드"
      subtitle="운영실 기준으로 대상자, 사건, 도움망, 문자 대기열, 타임라인, 보고서 반영 흐름을 한 번에 시연합니다."
    />
  )
}
