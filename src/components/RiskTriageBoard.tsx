import { riskFlags } from "@/lib/demo-data";
import type { RiskSeverity } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

const severityTone: Record<RiskSeverity, "safe" | "warn" | "danger" | "neutral"> = {
  low: "neutral",
  medium: "warn",
  high: "warn",
  critical: "danger"
};

const severityLabel: Record<RiskSeverity, string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
  critical: "긴급"
};

export function RiskTriageBoard() {
  return (
    <div className="risk-board">
      {riskFlags.map((risk) => (
        <article className="risk-ticket" key={risk.id}>
          <div className="row wrap">
            <StatusBadge label={severityLabel[risk.severity]} tone={severityTone[risk.severity]} />
            <span className="mono">{risk.code}</span>
          </div>
          <h3>{risk.title}</h3>
          <p>{risk.description}</p>
          <div className="mini-metrics">
            <span>담당: {risk.owner}</span>
            <span>기한: {risk.due}</span>
            <span>상태: {risk.status}</span>
          </div>
          <ol className="playbook">
            {risk.playbook.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </article>
      ))}
    </div>
  );
}
