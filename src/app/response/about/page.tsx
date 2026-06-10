import { PublicServiceIntroPanel } from '@/components/public/PublicServiceIntroPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '안부웍스 소개 | 부모님 안심관리',
  description: '안부웍스는 부모님 안부 신호를 보호자 알림, 방문확인, 병원동행, 안심 리포트로 연결하는 비의료 생활확인 서비스입니다.'
}

export default function ResponseAboutPage() {
  return <PublicServiceIntroPanel />
}
