import { Suspense } from 'react'
import { ProxyCheckinPanel } from '@/components/guardian/ProxyCheckinPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '보호자 대리 안부 기록 | 안부웍스',
  description: '보호자가 부모님과 전화한 뒤 안부 상태를 대신 기록합니다.'
}

export default function GuardianProxyCheckinPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">대리 안부 기록 화면을 불러오는 중입니다.</main>}>
      <ProxyCheckinPanel mode="guardian" />
    </Suspense>
  )
}
