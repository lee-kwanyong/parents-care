import { GovProposalLeadsPanel } from '@/components/ops/GovProposalLeadsPanel'

export const metadata = {
  title: '제안 문의 관리 | 안부웍스 운영실',
  description: '외부 제안 페이지에서 접수된 지자체·기관 문의를 관리합니다.'
}

export default function OpsProposalLeadsPage() {
  return <GovProposalLeadsPanel />
}
