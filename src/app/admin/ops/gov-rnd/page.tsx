import { AdminGovRndPipelinePanel } from '@/components/admin/AdminGovRndPipelinePanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '지자체·R&D 파이프라인 | 안부웍스 Admin',
  description: '지자체, R&D, 안부리포트 공급사, 투자사, 파트너 후속관리를 운영합니다.'
}

export default function AdminOpsGovRndPage() {
  return <AdminGovRndPipelinePanel />
}
