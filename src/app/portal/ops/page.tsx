import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const metadata = {
  title: '운영실 페이지 | 안부웍스',
  description: '운영실 자동운영, 알림, 도움망, 후속조치, 지자체 제출 화면 모음입니다.'
}

export default function OpsPortalPage() {
  return (
    <AdminMenuHub
      role="ops"
      title="운영실 페이지"
      subtitle="오토파일럿, Heartbeat, 도움망 네트워크, 알림 발송, 후속조치 관제를 한 곳에서 관리합니다."
    />
  )
}
