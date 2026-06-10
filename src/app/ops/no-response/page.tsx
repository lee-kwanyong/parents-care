import { NoResponsePanel } from '@/components/ops/NoResponsePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '미응답 자동 처리센터 | 안부웍스 운영실',
  description: '오늘 안부 신호가 없는 가구를 찾아 보호자 확인 문자와 대리입력을 유도합니다.'
}

export default function OpsNoResponsePage() {
  return <NoResponsePanel />
}
