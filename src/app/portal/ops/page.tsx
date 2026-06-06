import { RolePortalMenu } from '@/components/portal/RolePortalMenu'

export const metadata = {
  title: '운영실 페이지 | 안부웍스',
  description: '운영실 자동운영, 관제, 알림, 보고서, 제출 패키지 메뉴를 모았습니다.'
}

export default function OpsPortalPage() {
  return (
    <RolePortalMenu
      role="ops"
      title="운영실 페이지"
      subtitle="운영실 자동운영, 사건 관제, 알림, 도움망, 보고서, 지자체 제출 메뉴를 모았습니다."
    />
  )
}
