import { AdminOpsUnifiedDashboardPanel } from '@/components/admin/AdminOpsUnifiedDashboardPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '관리자 대시보드 | 안부웍스 Admin',
  description: '확인필요, 주의, 가입자, 가족, 스마트링 상태를 한 화면에서 관리합니다.'
}

export default function OpsPage() {
  return <AdminOpsUnifiedDashboardPanel />
}
