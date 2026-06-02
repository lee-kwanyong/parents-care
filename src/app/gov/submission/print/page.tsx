import { GovSubmissionPrintPanel } from '@/components/gov/GovSubmissionPrintPanel'

export const metadata = {
  title: '지자체 제출 패키지 인쇄본 | 안부웍스',
  description: '지자체 지원사업 제출용 제안서 패키지를 PDF로 저장하거나 인쇄합니다.'
}

export default function GovSubmissionPrintPage() {
  return <GovSubmissionPrintPanel />
}
