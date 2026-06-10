import { NotificationSafetyPanel } from '@/components/ops/NotificationSafetyPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '문자 안전정리센터 | 안부웍스 운영실',
  description: '테스트 문자, 과거 실패 문자, 실증 문자를 분리하고 재시도 위험을 정리합니다.'
}

export default function OpsNotificationSafetyPage() {
  return <NotificationSafetyPanel />
}
