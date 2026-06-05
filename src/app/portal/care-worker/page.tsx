import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const metadata = {
  title: '요양보호사·케어파트너 페이지 | 안부웍스',
  description: '지역 도움망이 요청을 수락하고 처리 결과를 남기는 화면 모음입니다.'
}

export default function CareWorkerPortalPage() {
  return (
    <AdminMenuHub
      role="careWorker"
      title="요양보호사·케어파트너 페이지"
      subtitle="운영실에서 보낸 요청을 확인하고 수락, 확인 시작, 처리 완료를 진행합니다."
    />
  )
}
