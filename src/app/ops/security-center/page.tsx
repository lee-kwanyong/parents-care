import { OpsSecurityCenterPanel } from '@/components/ops/OpsSecurityCenterPanel'

export const metadata = {
  title: 'RLS·권한 점검센터 | 안부웍스 운영실',
  description: '사건, 문자, 개인정보, 요양보호사 배치 데이터의 공개 접근 여부를 점검합니다.'
}

export default function OpsSecurityCenterPage() {
  return <OpsSecurityCenterPanel />
}
