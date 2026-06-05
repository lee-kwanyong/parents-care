import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const metadata = {
  title: '전체 어드민 메뉴 | 안부웍스',
  description: '안부웍스에서 만든 모든 화면을 역할별로 확인합니다.'
}

export default function AdminMenuPage() {
  return (
    <AdminMenuHub
      role="all"
      title="전체 어드민 메뉴"
      subtitle="부모님, 자녀, 요양보호사·케어파트너, 운영실, 지자체 관련 화면을 한 곳에서 확인합니다."
    />
  )
}
