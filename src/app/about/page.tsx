import { PublicServiceIntroPanel } from '@/components/public/PublicServiceIntroPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '서비스 소개 | 안부웍스',
  description: '부모님의 몸 상태와 도움 요청을 놓치지 않도록 보호자 알림과 리포트로 연결합니다.'
}

export default function AboutPage() {
  return <PublicServiceIntroPanel />
}
