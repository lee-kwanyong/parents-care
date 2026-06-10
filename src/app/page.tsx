import { PublicServiceIntroPanel } from '@/components/public/PublicServiceIntroPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '안부웍스 | 부모님 안부·생활확인 안심관리',
  description: '부모님의 몸 상태와 도움 요청을 보호자 알림, 방문확인, 병원동행, 생활확인 리포트로 연결합니다.'
}

export default function HomePage() {
  return <PublicServiceIntroPanel />
}
