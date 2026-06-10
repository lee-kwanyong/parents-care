import { Suspense } from 'react'
import { ProxyCheckinPanel } from '@/components/guardian/ProxyCheckinPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '운영실 대리 안부 기록 | 안부웍스',
  description: '운영실이 전화 확인 후 부모님 안부 상태를 대신 기록합니다.'
}

export default function OpsProxyCheckinPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">운영실 대리 안부 기록 화면을 불러오는 중입니다.</main>}>
      <ProxyCheckinPanel mode="ops" />
    </Suspense>
  )
}
