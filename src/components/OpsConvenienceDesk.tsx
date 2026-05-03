import { convenienceMetrics, documentRequests, hospitalConvenienceGuide, prepPackItems } from "@/lib/demo-data";
import { KpiStrip } from "./KpiStrip";
import { StatusBadge } from "./StatusBadge";

const opsChecks = [
  ["병원 동선 데이터", "정문, 접수층, 휠체어, 화장실, 약국, 귀가 대기 위치가 모두 입력됨", "완료"],
  ["서류 요청 누락", "보험 청구성 서류 요청이 수납 전에 매니저앱에 노출됨", "확인"],
  ["가족 담당자", "복약 확인, 다음 예약, 서류 확인 담당자가 지정됨", "완료"],
  ["민감정보 공유", "처방전·검사결과·영수증은 동의 범위와 연결해 표시", "주의"]
] as const;

export function OpsConvenienceDesk() {
  const requiredMissing = prepPackItems.filter((item) => item.required && item.status === "missing");
  return (
    <section className="convenience-panel stack">
      <div className="row wrap">
        <div>
          <h2>편의 운영 데스크</h2>
          <p>편의 기능은 단순 UX가 아니라 문의량, 현장 지연, 리포트 누락을 줄이는 운영 데이터입니다.</p>
        </div>
        <StatusBadge label={hospitalConvenienceGuide.hospitalName} tone="safe" />
      </div>

      <KpiStrip metrics={convenienceMetrics} />

      <div className="grid two">
        <div className="report-section highlight">
          <h3>운영실 확인 필요</h3>
          <ul>
            {requiredMissing.map((item) => <li key={item.id}>{item.title} · 담당 {item.owner}</li>)}
            {requiredMissing.length === 0 ? <li>필수 준비물 누락이 없습니다.</li> : null}
          </ul>
        </div>
        <div className="report-section">
          <h3>서류 요청 상태</h3>
          <ul>{documentRequests.map((doc) => <li key={doc.id}>{doc.title} · {doc.requester} · {doc.status}</li>)}</ul>
        </div>
      </div>

      <div className="table-like convenience-table">
        {opsChecks.map(([title, description, status]) => (
          <div className="table-row three-col" key={title}>
            <strong>{title}</strong>
            <span>{description}</span>
            <StatusBadge label={status} tone={status === "주의" ? "warn" : "safe"} />
          </div>
        ))}
      </div>
    </section>
  );
}
