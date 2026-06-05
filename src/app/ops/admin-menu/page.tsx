import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const metadata = {
  title: '운영실 전체 메뉴 | 안부웍스',
  description: '운영실 보호 영역 안에서 전체 메뉴를 확인합니다.'
}

export default function OpsAdminMenuPage() {
  return (
    <AdminMenuHub
      role="all"
      title="운영실 전체 메뉴"
      subtitle="운영실 인증 후 안부웍스 전체 화면을 확인합니다."
    />
  )
}
