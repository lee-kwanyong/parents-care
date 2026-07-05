import { RingCsvImportPanel } from '@/components/ops/RingCsvImportPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '데이터 파일 업로드 센터 | 안부웍스 운영실',
  description: '데이터 파일 또는 Export 데이터를 업로드해 안부리포트 리포트를 일괄 생성합니다.'
}

export default function OpsRingCsvImportPage() {
  return <RingCsvImportPanel />
}
