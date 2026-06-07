import { OnePageProposalPanel } from '@/components/gov/OnePageProposalPanel'

export const metadata = {
  title: '1페이지 실증 제안서 | 안부웍스 운영실',
  description: '지자체 담당자에게 보낼 한 장짜리 실증 협업 제안서를 편집하고 저장합니다.'
}

export default function OpsOnePageProposalPage() {
  return (
    <OnePageProposalPanel
      title="운영실 1페이지 실증 제안서"
      subtitle="지자체 담당자에게 보낼 한 장짜리 실증 협업 제안서를 편집하고 저장합니다."
    />
  )
}
