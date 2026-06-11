import { TodayRunbookPanel } from '@/components/ops/TodayRunbookPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '오늘 실증 운영센터 | 안부웍스 운영실',
  description: '가입, 동의, 실증 가구, 안부 신호, 보호자 리포트, 미응답, 문자 비용, 실증 리포트를 매일 같은 순서로 점검합니다.'
}

export default function OpsTodayRunbookPage() {
  return <TodayRunbookPanel />
}
