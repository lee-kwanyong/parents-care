import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const metadata = {
  title: '부모님 페이지 | 안부웍스',
  description: '부모님이 안부를 입력하고 자녀에게 신호를 보내는 화면 모음입니다.'
}

export default function ParentPortalPage() {
  return (
    <AdminMenuHub
      role="parent"
      title="부모님 페이지"
      subtitle="부모님이 식사, 복약, 몸 상태, 도움 요청을 남기는 화면으로 이동합니다."
    />
  )
}
