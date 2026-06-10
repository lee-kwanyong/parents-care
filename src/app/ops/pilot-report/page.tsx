import { PilotReportPanel } from '@/components/ops/PilotReportPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '실증 리포트 자동 생성센터 | 안부웍스 운영실',
  description: '가입자, 실증 가구, 안부 신호, 문자, 리포트 조회, 유저스푼 결과를 외부 미팅용 리포트로 정리합니다.'
}

export default function OpsPilotReportPage() {
  return <PilotReportPanel />
}
