import { AdminRingPilotDashboardPanel } from '@/components/admin/AdminRingPilotDashboardPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '스마트링 실증 대시보드 | 안부웍스 Admin',
  description: '스마트링 샘플, 가구 배정, 착용률, 데이터 품질, 배터리, 리포트 상태를 관리합니다.'
}

export default function OpsRingPilotDashboardPage() {
  return <AdminRingPilotDashboardPanel />
}
