import { RingReportLabPanel } from '@/components/ops/RingReportLabPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '스마트링 안부리듬 리포트 실험실 | 안부웍스 운영실',
  description: '수면, 활동, 심박, HRV, SpO2, 체온, 착용, 배터리 데이터를 보호자 안부리듬 리포트로 변환합니다.'
}

export default function OpsRingReportLabPage() {
  return <RingReportLabPanel />
}
