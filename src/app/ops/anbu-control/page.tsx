import { OpsControlMvp } from '@/components/AnbuWorksBuildout'

export const metadata = {
  title: '안부온 운영실 관제 | 안부웍스',
  description: '확인 필요 신호를 운영실에서 우선 처리합니다.'
}

export default function OpsAnbuControlPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8">
      <section className="mx-auto max-w-6xl">
        <OpsControlMvp />
      </section>
    </main>
  )
}
