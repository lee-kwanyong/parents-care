import { AnbuOutboxPage } from '@/components/AnbuOutbox'

export const metadata = {
  title: '알림 발송함 | 안부웍스',
  description: '대기 중인 알림을 확인하고 발송합니다.'
}

export default function OpsOutboxPage() {
  return <AnbuOutboxPage />
}
