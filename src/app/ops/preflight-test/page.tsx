import { PreflightTestPanel } from '@/components/ops/PreflightTestPanel'

export const metadata = {
  title: '실증 전 전체 기능 테스트 | 안부웍스 운영실',
  description: '모바일 앱, 운영실 API, DB, 요양보호사 즉시 배치, 토큰 수락, 상태 머신을 자동 점검합니다.'
}

export default function OpsPreflightTestPage() {
  return <PreflightTestPanel />
}
