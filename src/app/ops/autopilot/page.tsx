import { OpsAutopilotPanel } from '@/components/ops/OpsAutopilotPanel'

export const metadata = {
  title: '운영실 오토파일럿 | 안부웍스',
  description: '부모님 안부 신호가 생기면 운영실이 다음 행동을 자동 추천하고 실행합니다.'
}

export default function OpsAutopilotPage() {
  return <OpsAutopilotPanel />
}
