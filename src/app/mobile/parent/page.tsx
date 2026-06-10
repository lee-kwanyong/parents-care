import { Suspense } from 'react'
import { MobileParentSignalPanel } from '@/components/mobile/MobileParentSignalPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '부모님 신호 보내기 | 안부웍스 앱',
  description: '부모님이 괜찮아요, 식사, 복약, 몸 상태, 도움 요청 신호를 큰 버튼으로 보냅니다.'
}

export default function MobileParentPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">부모님 앱을 불러오는 중입니다.</main>}>
      <MobileParentSignalPanel />
    </Suspense>
  )
}
