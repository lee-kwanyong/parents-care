import { RolePortalMenu } from '@/components/portal/RolePortalMenu'

export const metadata = {
  title: '부모님 페이지 | 안부웍스',
  description: '부모님이 안부 신호를 입력하고 접속하는 데 필요한 메뉴만 모았습니다.'
}

export default function ParentPortalPage() {
  return (
    <RolePortalMenu
      role="parent"
      title="부모님 페이지"
      subtitle="부모님이 안부 신호를 입력하고 접속하는 데 필요한 화면만 모았습니다."
    />
  )
}
