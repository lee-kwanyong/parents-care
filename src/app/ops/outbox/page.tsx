import { AnbuOutboxPage } from '@/components/AnbuOutbox'

export const metadata = {
  title: '알림 발송함 | 안부웍스',
  description: '보호자 SMS 발송 상태를 확인합니다.'
}

export default function OpsOutboxPage() {
  return <AnbuOutboxPage />
}
