import { OpsHouseholdsPanel } from '@/components/ops/OpsHouseholdsPanel'

export const metadata = {
  title: '실증 대상자 관리 | 안부웍스 운영실',
  description: '지자체 실증과 운영실 관제를 위한 관리 대상자, 보호자, 권역, 위험군, 동의 상태를 관리합니다.'
}

export default function OpsHouseholdsPage() {
  return <OpsHouseholdsPanel />
}
