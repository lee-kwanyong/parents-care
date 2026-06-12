import { AdminGovRndHubPanel } from '@/components/admin/AdminGovRndHubPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '지자체·R&D 관리 | 안부웍스 Admin',
  description: '지자체, B2G, R&D, 바이오헬스, 스마트링 실증을 관리합니다.'
}

export default function OpsGovRndPage() {
  return <AdminGovRndHubPanel />
}
