import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
import { ManagerTrustCard } from '@/components/ManagerTrustCard'
import { ReportCard } from '@/components/ReportCard'
import { StatusTimeline } from '@/components/StatusTimeline'
import { demoManager, demoReport, demoTimeline } from '@/lib/mock-data'
export default function AppointmentDetailPage() { return <AppShell title="오늘 병원 일정" subtitle="자녀에게는 안심/확인필요/긴급 중심으로 보여주고, 자세한 내용은 아래에 둡니다."><div className="grid gap-6"><ManagerTrustCard manager={demoManager} /><Card><CardTitle title="진행 타임라인" /><StatusTimeline items={demoTimeline} /></Card><ReportCard report={demoReport} /></div></AppShell> }
