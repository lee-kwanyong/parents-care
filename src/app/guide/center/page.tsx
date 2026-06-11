import { TrainingGuidePanel } from '@/components/public/TrainingGuidePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '기관·방문요양센터 안내 | 안부웍스',
  description: '방문요양센터와 기관에 안부웍스 실증 범위와 비의료 생활확인 흐름을 설명합니다.'
}

export default function CenterGuidePage() {
  return <TrainingGuidePanel audience="center" />
}
