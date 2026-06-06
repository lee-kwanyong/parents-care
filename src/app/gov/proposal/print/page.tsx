import { GovProposalLanding } from '@/components/gov/GovProposalLanding'

export const metadata = {
  title: '지자체 스마트 돌봄 제안 인쇄본 | 안부웍스',
  description: '안부웍스 지자체 제안 인쇄·PDF 저장용 페이지입니다.'
}

export default function GovProposalPrintPage() {
  return <GovProposalLanding printMode />
}
