import type { OpsMetric } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function KpiStrip({ metrics }: { metrics: OpsMetric[] }) {
  return (
    <div className="kpi-grid">
      {metrics.map((metric) => (
        <div className="metric-card" key={metric.label}>
          <div className="row">
            <span>{metric.label}</span>
            <StatusBadge label={metric.tone === "warn" ? "주의" : "정상"} tone={metric.tone ?? "neutral"} />
          </div>
          <strong>{metric.value}</strong>
          <small>{metric.helper}</small>
        </div>
      ))}
    </div>
  );
}
