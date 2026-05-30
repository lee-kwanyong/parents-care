import { AnbuEscalationOps } from '@/components/AnbuEscalationOps'

export const metadata = {
  title: '무응답 에스컬레이션 | 안부웍스 운영실',
  description: '부모님 무응답을 단계별로 확인하고 운영 조치를 기록합니다.'
}

export default function OpsEscalationPage() {
  return <AnbuEscalationOps />
}
