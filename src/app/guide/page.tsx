import { TrainingGuidePanel } from '@/components/public/TrainingGuidePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '안부웍스 사용 가이드',
  description: '보호자, 부모님, 생활확인 파트너가 안부웍스를 어떻게 쓰는지 안내합니다.'
}

export default function GuidePage() {
  return <TrainingGuidePanel audience="all" />
}
