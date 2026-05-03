import { demoManager, vehiclePolicyCopy } from "@/lib/demo-data";
import type { ManagerTrustSummary } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function ManagerTrustCard({ manager = demoManager }: { manager?: ManagerTrustSummary }) {
  return (
    <div className="card stack">
      <div className="row">
        <div>
          <h3>{manager.name}</h3>
          <p>완료 {manager.completedCount}건 · 평균평점 {manager.ratingAverage.toFixed(1)} · {manager.specialties.join("/")} 전문</p>
        </div>
        <StatusBadge label={manager.approved ? `안심도 ${manager.trustScore}` : "심사 중"} tone={manager.approved ? "safe" : "warn"} />
      </div>
      <div className="grid two compact-grid">
        <div className="mini-card"><strong>가능 지역</strong><span>{manager.regions.join(", ")}</span></div>
        <div className="mini-card"><strong>확인 항목</strong><span>{manager.verificationBadges.join(" · ")}</span></div>
        <div className="mini-card"><strong>차량 보유</strong><span>{manager.hasVehicle ? "있음" : "없음"} · 직접 운송 의미 아님</span></div>
        <div className="mini-card"><strong>직접 운송 가능</strong><span>{manager.directTransportAllowed ? "별도 제휴/정책 승인 필요" : "기본 서비스 미포함"}</span></div>
      </div>
      <div className="policy-box">
        <strong>이동 방식: {manager.transportModeLabel}</strong>
        <p>{vehiclePolicyCopy}</p>
      </div>
    </div>
  );
}
