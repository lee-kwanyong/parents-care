import { AdminAccessPanel } from '@/components/admin/AdminAccessPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin | 안부웍스',
  description: '안부웍스 관리자 접속 화면입니다.'
}

export default function AdminPage() {
  return <AdminAccessPanel />
}
