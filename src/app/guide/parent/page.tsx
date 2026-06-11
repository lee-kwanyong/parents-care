import { TrainingGuidePanel } from '@/components/public/TrainingGuidePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '부모님 사용 가이드 | 안부웍스',
  description: '부모님이 큰 버튼 하나로 오늘 안부를 보내는 방법입니다.'
}

export default function ParentGuidePage() {
  return <TrainingGuidePanel audience="parent" />
}
