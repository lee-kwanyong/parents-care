import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
import { ManagerTrustCard } from '@/components/ManagerTrustCard'
import { demoManager } from '@/lib/mock-data'

export default function AssignmentsPage() {
  return (
    <AppShell title="매니저 심사/승인·배정" subtitle="승인된 매니저만 병원동행 일정에 배정합니다.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle title="배정 대기 일정" desc="김영희님 · 서울튼튼병원 · 2026-04-29 10:30" />
          <div className="space-y-3 text-sm text-slate-700">
            <p className="rounded-2xl bg-slate-50 p-3">픽업/이동 방식: 집 앞 만남 후 택시 동행</p>
            <p className="rounded-2xl bg-slate-50 p-3">보호자 질문: 약 복용 주의사항, 다음 예약 필요 여부</p>
            <p className="rounded-2xl bg-amber-50 p-3 text-amber-950">차량 직접 운송 요청 없음 · 차량 보유 정보는 참고용</p>
          </div>
          <button className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white">김도윤 매니저 배정</button>
        </Card>
        <ManagerTrustCard manager={demoManager} />
      </div>
    </AppShell>
  )
}
