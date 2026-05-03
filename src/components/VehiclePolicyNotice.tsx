import { vehiclePolicyCopy } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function VehiclePolicyNotice() {
  return (
    <div className="card stack policy-card">
      <div className="row">
        <h3>차량/이동 정책</h3>
        <StatusBadge label="차량 보유 ≠ 직접 운송" tone="warn" />
      </div>
      <p>{vehiclePolicyCopy}</p>
      <div className="grid three compact-grid">
        <div className="mini-card"><strong>기본 1</strong><span>병원 앞 만남</span></div>
        <div className="mini-card"><strong>기본 2</strong><span>집 앞 만남 후 택시 동행</span></div>
        <div className="mini-card"><strong>기본 3</strong><span>이동지원 제휴 연결</span></div>
      </div>
    </div>
  );
}
