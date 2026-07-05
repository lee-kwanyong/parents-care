import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin 통합 메뉴 | 안부웍스',
  description: '운영실, 지자체, R&D, 안부리포트, 문자·알림 메뉴를 통합합니다.'
}

export default function AdminMenuPage() {
  return (
    <AdminMenuHub
      role="admin"
      showAdminOnly
      title="Admin 통합 메뉴"
      subtitle="고객 메뉴와 분리된 운영실, 지자체/B2G, R&D, 안부리포트, 문자·알림 화면 모음입니다."
    />
  )
}
