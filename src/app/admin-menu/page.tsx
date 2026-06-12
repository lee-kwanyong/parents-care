import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const dynamic = 'force-dynamic'

export default function AdminMenuPage() {
  return (
    <AdminMenuHub
      role="admin"
      showAdminOnly
      title="Admin 통합 메뉴"
      subtitle="고객 메뉴와 분리된 운영실 / 지자체 / B2G / R&D / 스마트링 / 문자 관련 화면 모음입니다."
    />
  )
}
