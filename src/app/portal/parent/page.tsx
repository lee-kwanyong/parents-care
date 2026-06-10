import { Suspense } from 'react'
import { MobileParentSignalPanel } from '@/components/mobile/MobileParentSignalPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '부모님 페이지 | 안부웍스',
  description: '부모님이 오늘 안부 신호를 큰 버튼으로 보냅니다.'
}

export default function PortalParentPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">부모님 페이지를 불러오는 중입니다.</main>}>
      <MobileParentSignalPanel />
    </Suspense>
  )
}
