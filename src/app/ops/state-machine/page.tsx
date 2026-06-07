import { OpsStateMachinePanel } from '@/components/ops/OpsStateMachinePanel'

export const metadata = {
  title: '긴급 사건 상태 머신 | 안부웍스 운영실',
  description: '긴급 사건의 중복 수락, 만료 링크, 오래된 미수락 사건, 완료 후 재배치를 점검합니다.'
}

export default function OpsStateMachinePage() {
  return <OpsStateMachinePanel />
}
