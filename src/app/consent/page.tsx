import { ConsentFlowPanel } from '@/components/onboarding/ConsentFlowPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '실증 참여 동의 | 안부웍스',
  description: '안부웍스 비의료 안부 참고 서비스 이용 전 필수 동의를 확인합니다.'
}

export default function ConsentPage() {
  return <ConsentFlowPanel />
}
