import { PlanGate } from '@/components/PlanGate'
import { WeeklyReportMvp } from '@/components/AnbuWorksBuildout'

export const metadata = {
  title: '주간 돌봄 리포트 | 안부웍스',
  description: '부모님 안부 변화와 다음 행동을 자동 리포트로 확인합니다.'
}

export default function WeeklyReportPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8">
      <section className="mx-auto max-w-6xl">
        <PlanGate
          minimumPlan="basic"
          featureTitle="주간 돌봄 리포트"
          description="식사, 복약, 몸 상태, 응답 없음 기록을 주간 단위로 요약하려면 안부온 베이직 이상이 필요합니다."
        >
          <WeeklyReportMvp />
        </PlanGate>
      </section>
    </main>
  )
}
