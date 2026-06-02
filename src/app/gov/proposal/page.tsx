import { GovPlatformPanel } from '@/components/gov/GovPlatformPanel'

export const metadata = {
  title: 'R&D 제안 패키지 | 안부웍스',
  description: '정부·지자체 R&D 제안용 사업 구조를 확인합니다.'
}

export default function GovProposalPage() {
  return <GovPlatformPanel initialTab="proposal" />
}
