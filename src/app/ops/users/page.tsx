import { OpsUsersPanel } from '@/components/ops/OpsUsersPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '가입자·실증 참여자 관리센터 | 안부웍스 운영실',
  description: '회원가입, 역할, 부모님 연결, 안부 신호, 문자 발송 전환을 한 화면에서 확인합니다.'
}

export default function OpsUsersPage() {
  return <OpsUsersPanel />
}
