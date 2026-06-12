import { RolePortalMenu } from '@/components/portal/RolePortalMenu'

export const metadata = {
  title: '요양보호사·케어파트너 페이지 | 안부웍스',
  description: '지역 도움망 요청 수락과 처리 완료에 필요한 메뉴만 모았습니다.'
}

export default function CareWorkerPortalPage() {
  return (
    <RolePortalMenu
      role="care-worker"
      title="요양보호사·케어파트너 페이지"
      subtitle="지역 도움망 요청 수락, 전화·방문 확인, 처리 완료에 필요한 화면만 모았습니다."
    />
  )
}
