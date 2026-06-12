import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const dynamic = 'force-dynamic'

export default function AdminOpsPage() {
  return (
    <AdminMenuHub
      role="admin"
      showAdminOnly
      title="Admin 운영실"
      subtitle="운영실, 지자체/B2G, R&D, 스마트링, 문자 관련 기능을 여기서 통합 관리합니다."
    />
  )
}
