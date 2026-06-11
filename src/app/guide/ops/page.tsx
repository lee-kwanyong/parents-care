import { TrainingGuidePanel } from '@/components/public/TrainingGuidePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '운영실 실증 운영 가이드 | 안부웍스',
  description: '운영실이 오늘 실증 운영센터에서 시작해 실증 리포트까지 저장하는 순서입니다.'
}

export default function OpsGuidePage() {
  return <TrainingGuidePanel audience="ops" />
}
