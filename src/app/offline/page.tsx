import Link from 'next/link'
import { CareCard } from '@/components/ui/CareCard'
import { CareButton } from '@/components/ui/CareButton'

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2F4948]">
      <section className="mx-auto max-w-xl">
        <CareCard tone="amber">
          <h1 className="text-4xl font-black leading-tight">
            지금은 인터넷 연결이
            <br />
            불안정합니다.
          </h1>
          <p className="mt-4 text-lg font-bold leading-8">
            저장된 화면은 일부 볼 수 있지만, 접수·업로드·상태 변경은 연결 후 다시 시도해주세요.
          </p>

          <div className="mt-6 grid gap-3">
            <CareButton href="/child" tone="dark" size="xl">
              자녀앱 홈으로
            </CareButton>
            <CareButton href="/parent/today" tone="white" size="xl">
              부모님 큰 글씨 화면
            </CareButton>
          </div>
        </CareCard>
      </section>
    </main>
  )
}
