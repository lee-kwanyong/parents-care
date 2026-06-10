import { ReportTrackingPanel } from '@/components/ops/ReportTrackingPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '보호자 리포트 조회 추적센터 | 안부웍스 운영실',
  description: '리포트 화면 진입, 가족코드 조회 성공/실패, 부모님 앱 링크 복사 이벤트를 추적합니다.'
}

export default function OpsReportTrackingPage() {
  return <ReportTrackingPanel />
}
