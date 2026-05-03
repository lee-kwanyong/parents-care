import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
import { ManagerTrustCard } from '@/components/ManagerTrustCard'
import { RatingForm } from '@/components/RatingForm'
import { ReportCard } from '@/components/ReportCard'
import { StatusTimeline } from '@/components/StatusTimeline'
import { demoManager, demoReport, demoTimeline } from '@/lib/mock-data'

export default function AppointmentDetailPage() {
  return (
    <AppShell title="병원동행 상세" subtitle="타임라인, 매니저 신뢰정보, 보호자 리포트, 평가를 한 화면에서 확인합니다.">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          <Card>
            <CardTitle title="진행 타임라인" desc="몇 시에 어디서 어떻게 진행되는지 가족이 공동조회합니다." />
            <StatusTimeline items={demoTimeline} />
          </Card>
          <Card>
            <CardTitle title="보호자 리포트" desc="운영실 검수 후 가족에게 발송되는 최종 리포트입니다." />
            <ReportCard report={demoReport} />
          </Card>
        </div>
        <div className="space-y-5">
          <ManagerTrustCard manager={demoManager} />
          <RatingForm />
        </div>
      </div>
    </AppShell>
  )
}
