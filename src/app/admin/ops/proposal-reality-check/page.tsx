import { AdminProposalCompliancePanel } from '@/components/admin/AdminProposalCompliancePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '제안 표현 점검 | 안부웍스 Admin',
  description: '사업계획서, 지자체 제안서, 고객 화면 문구를 비의료 안부 참고 표현으로 점검합니다.'
}

export default function AdminOpsProposalRealityCheckPage() {
  return <AdminProposalCompliancePanel />
}
