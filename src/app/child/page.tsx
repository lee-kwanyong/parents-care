import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
import { ManagerTrustCard } from '@/components/ManagerTrustCard'
import { StatusTimeline } from '@/components/StatusTimeline'
import { demoManager, demoTimeline } from '@/lib/mock-data'

export default function ChildHomePage() {
  return (
    <AppShell title="자녀앱" subtitle="부모님 병원 일정 등록부터 보호자 리포트와 매니저 평가까지 확인합니다.">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <Card>
            <CardTitle eyebrow="오늘 일정" title="어머니 정형외과 진료" desc="2026-04-29 10:30 · 서울튼튼병원" />
            <div className="grid gap-3 md:grid-cols-3">
              <Link href="/child/appointments/new" className="rounded-2xl bg-blue-600 p-4 font-bold text-white">병원 일정 등록</Link>
              <Link href="/child/appointments/demo" className="rounded-2xl bg-white p-4 font-bold text-blue-700 ring-1 ring-blue-200">타임라인 확인</Link>
              <button className="rounded-2xl bg-slate-100 p-4 text-left font-bold text-slate-800">가족 공동조회 코드: 482913</button>
            </div>
          </Card>
          <Card>
            <CardTitle title="몇 시에 어디서 어떻게 진행되는지" desc="운영실과 매니저의 진행상태 업데이트가 가족 타임라인에 반영됩니다." />
            <StatusTimeline items={demoTimeline} />
          </Card>
        </div>
        <div className="space-y-5">
          <ManagerTrustCard manager={demoManager} />
          <Card>
            <CardTitle title="보호자 리포트" desc="진료 내용, 안내사항, 검사/약/다음 예약, 비용, 컨디션, 다음 액션을 확인합니다." />
            <Link href="/child/appointments/demo" className="block rounded-2xl bg-slate-950 px-4 py-3 text-center font-bold text-white">리포트/평가 보기</Link>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
