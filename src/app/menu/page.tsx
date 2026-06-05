import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const metadata = {
  title: '전체 메뉴 | 안부웍스',
  description: '안부웍스 전체 메뉴입니다.'
}

export default function MenuPage() {
  return (
    <AdminMenuHub
      role="all"
      title="전체 메뉴"
      subtitle="필요한 역할과 화면으로 바로 이동하세요."
    />
  )
}
