import { MessageAutomationPanel } from '@/components/ops/MessageAutomationPanel'

export const metadata = {
  title: '상황별 문자 자동화센터 | 안부웍스 운영실',
  description: '부모님 안부 신호, 긴급 요청, 수락, 완료, 문자 실패 상황에 따라 자동 문자 문구를 선택하고 발송합니다.'
}

export default function OpsMessageAutomationPage() {
  return <MessageAutomationPanel />
}
