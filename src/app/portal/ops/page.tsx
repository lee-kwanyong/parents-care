import { OpsAdminHomePanel } from '@/components/ops/OpsAdminHomePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '운영실 한눈 홈 | 안부웍스',
  description: '오늘 실증 운영 순서, 주의 항목, 가입자, 동의, 안부, 문자, 리포트를 한 화면에서 확인합니다.'
}

export default function OpsPortalPage() {
  return <OpsAdminHomePanel />
}
