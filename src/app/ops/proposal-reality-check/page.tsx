import { ProposalRealityCheckPanel } from '@/components/ops/ProposalRealityCheckPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '제안서 표현 현실화 센터 | 안부웍스 운영실',
  description: '현재 기능, 예비실증, 기관실증, 장기 B2G/IoT 비전을 구분해 외부 제안 표현 리스크를 낮춥니다.'
}

export default function OpsProposalRealityCheckPage() {
  return <ProposalRealityCheckPanel />
}
