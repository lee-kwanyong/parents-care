import { AnbuRoutineMvp, RiskScoreGuideMvp } from '@/components/AnbuWorksBuildout'

export const metadata = {
  title: '안부 루틴 | 안부웍스',
  description: '부모님 안부 확인 루틴과 응답 없음 알림을 설정합니다.'
}

export default function AnbuRoutinesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <AnbuRoutineMvp />
        <RiskScoreGuideMvp />
      </section>
    </main>
  )
}
