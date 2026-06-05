import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const metadata = {
  title: '자녀·보호자 페이지 | 안부웍스',
  description: '자녀와 보호자가 부모님 상태와 후속조치를 확인하는 화면 모음입니다.'
}

export default function ChildPortalPage() {
  return (
    <AdminMenuHub
      role="child"
      title="자녀·보호자 페이지"
      subtitle="부모님 안부 리포트, 가족 실행 요청, 후속조치 상태를 확인합니다."
    />
  )
}
