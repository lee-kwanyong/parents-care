import { TrainingGuidePanel } from '@/components/public/TrainingGuidePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '생활확인 파트너 가이드 | 안부웍스',
  description: '생활확인 파트너가 요청함, 수락, 결과 기록, 책임범위를 확인하는 방법입니다.'
}

export default function ProviderGuidePage() {
  return <TrainingGuidePanel audience="provider" />
}
