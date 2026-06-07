import { UrgentProviderRequestsPanel } from '@/components/provider/UrgentProviderRequestsPanel'

export const metadata = {
  title: '요양보호사 긴급 요청함 | 안부웍스',
  description: '가까운 어르신의 긴급 확인 요청을 수락하고 완료 처리합니다.'
}

export default function ProviderUrgentRequestsPage() {
  return <UrgentProviderRequestsPanel />
}
