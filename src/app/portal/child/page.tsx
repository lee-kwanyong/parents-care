import { RolePortalMenu } from '@/components/portal/RolePortalMenu'

export const metadata = {
  title: '자녀·보호자 페이지 | 안부웍스',
  description: '부모님 리포트, 가족 실행, 후속조치 확인에 필요한 메뉴만 모았습니다.'
}

export default function ChildPortalPage() {
  return (
    <RolePortalMenu
      role="child"
      title="자녀·보호자 페이지"
      subtitle="부모님 리포트, 가족 실행 보드, 후속조치 확인에 필요한 화면만 모았습니다."
    />
  )
}
