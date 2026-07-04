import { PublicServiceIntroPanel } from '@/components/public/PublicServiceIntroPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '안부웍스 | 확인완료형 안부케어',
  description: '부모님 안부를 확인 사건과 안부완료 리포트로 남기는 비의료 안부케어 서비스입니다.'
}

export default function HomePage() {
  return <PublicServiceIntroPanel />
}
