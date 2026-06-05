import { NotificationCleanupPanel } from '@/components/ops/NotificationCleanupPanel'

export const metadata = {
  title: '알림 기록 정리센터 | 안부웍스 운영실',
  description: '테스트 문자, 실패 기록, 오래된 대기 알림, 발송 완료 기록을 운영 화면에서 분리합니다.'
}

export default function NotificationCleanupPage() {
  return <NotificationCleanupPanel />
}
