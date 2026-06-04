import { Suspense } from 'react'
import { OpsLoginClient } from '@/components/ops/OpsLoginClient'

export const metadata = {
  title: '운영실 로그인 | 부모님 안심케어',
  description: '운영실 비밀번호를 입력합니다.'
}

export default function OpsLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
          <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D8EEE8]">
            <div className="text-2xl font-black tracking-[-0.05em]">
              운영실 로그인 준비 중입니다.
            </div>
          </section>
        </main>
      }
    >
      <OpsLoginClient />
    </Suspense>
  )
}
