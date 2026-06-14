import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin 운영실 | 안부웍스',
  description: '운영실, 지자체, R&D, 스마트링, 문자·알림 기능을 통합 관리합니다.'
}

export default function AdminOpsPage() {
  return (
    <AdminMenuHub
      role="admin"
      showAdminOnly
      title="Admin 운영실"
      subtitle="운영, 스마트링·R&D, 지자체·R&D, 문자·알림을 한눈에 보고 바로 처리합니다."
    />
  )
}
