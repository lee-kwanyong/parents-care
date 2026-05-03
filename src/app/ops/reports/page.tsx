import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
import { ReportCard } from '@/components/ReportCard'
import { demoReport } from '@/lib/mock-data'

export default function OpsReportsPage() {
  return (
    <AppShell title="리포트 검수/발송" subtitle="매니저 초안을 운영실이 확인한 뒤 가족에게 발송합니다.">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardTitle title="리포트 초안" desc="의료적 판단으로 오해될 수 있는 문구는 운영실에서 점검합니다." />
          <ReportCard report={demoReport} />
        </Card>
        <Card>
          <CardTitle title="검수 체크" />
          {['의료진 안내사항 구분', '검사/약/다음 예약 포함', '비용 포함', '부모님 컨디션 포함', '가족 다음 액션 포함'].map((item) => (
            <label key={item} className="mb-2 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <input type="checkbox" />
              <span className="text-sm font-medium text-slate-800">{item}</span>
            </label>
          ))}
          <button className="mt-3 w-full rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white">보호자에게 발송</button>
        </Card>
      </div>
    </AppShell>
  )
}
