import { AdminFamilyHubPanel } from '@/components/admin/AdminFamilyHubPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '가입자 통합관리 | 안부웍스 Admin',
  description: '가입자, 가족, 보호자, 부모님, 안부리포트 상태를 통합 관리합니다.'
}

export default function AdminFamiliesPage() {
  return <AdminFamilyHubPanel />
}
