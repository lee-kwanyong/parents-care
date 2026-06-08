import { Suspense } from 'react'
import { MessageAutomationPanel } from '@/components/ops/MessageAutomationPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '상황별 문자 자동화센터 | 안부웍스 운영실',
  description: '부모님 신호, 긴급 요청, 수락, 완료, 문자 실패 상황에 따라 자동 문자 문구를 선택하고 발송합니다.'
}

export default function OpsMessageAutomationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7FFFC] px-4 py-10 text-[#17443F]">
          <section className="mx-auto max-w-5xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            상황별 문자 자동화센터를 불러오는 중입니다.
          </section>
        </main>
      }
    >
      <MessageAutomationPanel />
    </Suspense>
  )
}
