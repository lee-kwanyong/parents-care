import { NotificationDispatchPanel } from '@/components/ops/NotificationDispatchPanel'

export const metadata = {
  title: '알림 발송센터 | 안부웍스 운영실',
  description: '후속조치 요청 알림을 SOLAPI SMS로 발송하고 성공·실패를 확인합니다.'
}

export default function OpsNotificationDispatchPage() {
  return <NotificationDispatchPanel />
}
