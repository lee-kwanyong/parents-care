import { AnbuRoutineMvp, RiskScoreGuideMvp } from '@/components/AnbuWorksBuildout'
import { PlanGate } from '@/components/PlanGate'

export const metadata = {
  title: '안부 루틴 | 안부웍스',
  description: '부모님 안부 확인 루틴과 응답 없음 알림을 설정합니다.'
}

export default function AnbuRoutinesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-5 py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <PlanGate
          minimumPlan="basic"
          featureTitle="안부 루틴"
          description="아침 식사, 복약, 밤 안부처럼 앱이 먼저 묻는 자동 루틴은 안부온 베이직 이상에서 사용할 수 있습니다."
        >
          <AnbuRoutineMvp />
          <RiskScoreGuideMvp />
        </PlanGate>
      </section>
    </main>
  )
}
