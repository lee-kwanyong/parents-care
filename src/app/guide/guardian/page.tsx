import { TrainingGuidePanel } from '@/components/public/TrainingGuidePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '보호자 사용 가이드 | 안부웍스',
  description: '보호자가 동의서, 부모님 앱 링크 전달, 오늘 리포트, 대리입력을 사용하는 방법입니다.'
}

export default function GuardianGuidePage() {
  return <TrainingGuidePanel audience="guardian" />
}
