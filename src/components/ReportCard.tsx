import type { CareReport } from '@/lib/types'

export function ReportCard({ report }: { report: CareReport }) {
  return (
    <div className="space-y-4">
      <ReportSection title="진료 진행 내용" items={[report.visitSummary]} />
      <ReportSection title="의료진 안내사항" items={report.doctorInstructions} />
      <ReportSection title="검사/약/다음 예약" items={[...report.tests, ...report.medications, report.nextAppointment ?? '다음 예약 없음']} />
      <ReportSection title="비용" items={[report.cost]} />
      <ReportSection title="부모님 컨디션" items={[report.condition]} />
      <ReportSection title="가족이 해야 할 다음 액션" items={report.nextActions} highlight />
    </div>
  )
}

function ReportSection({ title, items, highlight }: { title: string; items: string[]; highlight?: boolean }) {
  return (
    <section className={highlight ? 'rounded-2xl bg-blue-50 p-4' : 'rounded-2xl bg-slate-50 p-4'}>
      <h3 className="font-bold text-slate-950">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </section>
  )
}
