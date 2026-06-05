import { GovDemoRunnerPanel } from '@/components/gov/GovDemoRunnerPanel'

export const metadata = {
  title: '지자체 실증 시연 모드 | 안부웍스',
  description: '버튼 하나로 대상자, 사건, 도움망, 문자 대기열, 타임라인, 보고서 반영 흐름을 생성합니다.'
}

export default function GovDemoRunnerPage() {
  return <GovDemoRunnerPanel />
}
