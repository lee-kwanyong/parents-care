import { demoReport, reportQualityChecklist } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function QualityGatePanel() {
  return (
    <div className="quality-panel stack">
      <div className="row wrap">
        <div>
          <h3>리포트 품질 게이트</h3>
          <p>운영실 검수 전에는 보호자에게 발송하지 않습니다.</p>
        </div>
        <div className="candidate-score small">
          <strong>{demoReport.qualityScore}</strong>
          <span>품질점수</span>
        </div>
      </div>
      <div className="check-grid">
        {reportQualityChecklist.map((item, index) => (
          <div className="check-card" key={item}>
            <StatusBadge label={index < 4 ? "통과" : "검토"} tone={index < 4 ? "safe" : "warn"} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
