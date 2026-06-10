import { SmsBudgetGuardPanel } from '@/components/ops/SmsBudgetGuardPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '문자 비용·자동발송 보호센터 | 안부웍스 운영실',
  description: '하루 문자 한도, 가구별 문자 한도, 테스트 번호 모드, 예상 비용, 위험 대기열을 관리합니다.'
}

export default function OpsSmsBudgetGuardPage() {
  return <SmsBudgetGuardPanel />
}
