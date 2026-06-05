import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

export const metadata = {
  title: '운영실 어드민 홈 | 안부웍스',
  description: '운영실에서 필요한 모든 관리 화면으로 이동합니다.'
}

export default function OpsHomePage() {
  return (
    <AdminMenuHub
      role="ops"
      title="운영실 어드민 홈"
      subtitle="운영실 업무는 이 화면에서 시작하세요. 자동운영, 도움망, 알림, 후속조치, 지자체 제출 메뉴를 모두 모았습니다."
    />
  )
}
