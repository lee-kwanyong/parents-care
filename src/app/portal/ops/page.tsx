import { OpsAdminHomePanel } from '@/components/ops/OpsAdminHomePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '운영실 한눈 홈 | 안부웍스',
  description: '실증 시작, 문자 자동화, 알림 발송, 긴급 요청, 리포트 저장까지 운영 순서대로 안내합니다.'
}

export default function OpsPortalPage() {
  return <OpsAdminHomePanel />
}
