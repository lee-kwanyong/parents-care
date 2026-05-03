import { backupDispatchPlaybook, safetyEscalations } from "@/lib/demo-data";
import type { RiskSeverity } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

const severityTone: Record<RiskSeverity, "safe" | "warn" | "danger" | "neutral"> = {
  low: "neutral",
  medium: "warn",
  high: "warn",
  critical: "danger"
};

export function BackupDispatchPanel() {
  return (
    <div className="backup-panel stack">
      <div>
        <h3>지연·노쇼 대체 배정 Playbook</h3>
        <p>만남 암호 또는 안전 종료 확인이 끊기면 운영실은 연락 확인과 대체 매니저 후보 확인을 동시에 시작합니다.</p>
      </div>
      <div className="grid two compact-grid">
        {safetyEscalations.map((item) => (
          <article className="risk-ticket" key={item.id}>
            <div className="row wrap">
              <StatusBadge label={item.severity} tone={severityTone[item.severity]} />
              <span className="mono">{item.checkpointCode}</span>
            </div>
            <h3>{item.trigger}</h3>
            <p>{item.fallbackAction}</p>
            <div className="mini-metrics">
              <span>담당: {item.owner}</span>
              <span>상태: {item.status}</span>
            </div>
          </article>
        ))}
      </div>
      <ol className="playbook">
        {backupDispatchPlaybook.map((step) => <li key={step}>{step}</li>)}
      </ol>
    </div>
  );
}
