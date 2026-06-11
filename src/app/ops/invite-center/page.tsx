import { InviteCenterPanel } from '@/components/ops/InviteCenterPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '실증 참여자 초대 링크 관리센터 | 안부웍스 운영실',
  description: '보호자, 부모님, 생활확인 파트너, 방문요양센터에 보낼 동의서·앱·리포트·대리입력 링크와 문구를 생성합니다.'
}

export default function OpsInviteCenterPage() {
  return <InviteCenterPanel />
}
