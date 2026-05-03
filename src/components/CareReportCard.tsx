import type { CareReport } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

const statusLabel: Record<CareReport["status"], string> = {
  draft: "초안",
  submitted: "검수 요청",
  reviewing: "운영실 검수",
  approved: "승인",
  sent: "발송 완료",
  revision_requested: "보완 요청"
};

export function CareReportCard({ report }: { report: CareReport }) {
  return (
    <div className="card stack">
      <div className="row">
        <h3>보호자 리포트</h3>
        <StatusBadge label={statusLabel[report.status]} tone={report.status === "sent" ? "safe" : "warn"} />
      </div>
      <ReportSection title="진료 진행 내용" items={[report.visitSummary]} />
      <ReportSection title="의료진 안내사항" items={report.doctorInstructions} />
      <ReportSection title="검사/약/다음 예약" items={[...report.tests, ...report.medications, report.nextAppointment ?? "다음 예약 없음"]} />
      <ReportSection title="비용" items={[report.cost]} />
      <ReportSection title="부모님 컨디션" items={[report.parentCondition]} />
      <ReportSection title="가족이 해야 할 다음 액션" items={report.guardianNextActions} highlight />
    </div>
  );
}

function ReportSection({ title, items, highlight = false }: { title: string; items: string[]; highlight?: boolean }) {
  return (
    <section className={highlight ? "report-section highlight" : "report-section"}>
      <strong>{title}</strong>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}
