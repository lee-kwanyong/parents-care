import { transportModes, vehiclePolicyCopy } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";

export function PolicyGuardrail() {
  return (
    <section className="policy-panel stack" aria-label="차량 및 이동 정책 가드레일">
      <div className="row">
        <div>
          <div className="kicker">정책 가드레일</div>
          <h2>차량 보유와 직접 운송을 절대 같은 뜻으로 보이지 않게 설계했습니다.</h2>
        </div>
        <StatusBadge label="필수 노출" tone="warn" />
      </div>
      <p>{vehiclePolicyCopy}</p>
      <div className="grid three">
        {transportModes.map((mode) => (
          <div className="policy-mini" key={mode.code}>
            <strong>{mode.label}</strong>
            <span>{mode.short}</span>
            <StatusBadge label={mode.requiresOpsReview ? "운영 검토" : "기본 가능"} tone={mode.requiresOpsReview ? "warn" : "safe"} />
          </div>
        ))}
      </div>
    </section>
  );
}
