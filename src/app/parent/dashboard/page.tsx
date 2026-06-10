import { Suspense } from 'react'
import { MobileParentSignalPanel } from '@/components/mobile/MobileParentSignalPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '부모님 안부 입력 | 안부웍스',
  description: '부모님이 오늘 안부 신호를 입력합니다.'
}

export default function ParentDashboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8">안부 입력 화면을 불러오는 중입니다.</main>}>
      <MobileParentSignalPanel />
    </Suspense>
  )
}
