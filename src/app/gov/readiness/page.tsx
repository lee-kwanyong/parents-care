import { GovReadinessPanel } from '@/components/gov/GovReadinessPanel'

export const metadata = {
  title: '제출 전 준비상태 점검 | 안부웍스',
  description: '지자체 지원사업 제출 전 서비스, DB, 문서, 보안 준비상태를 점검합니다.'
}

export default function GovReadinessPage() {
  return <GovReadinessPanel />
}
