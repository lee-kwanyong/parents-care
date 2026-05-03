import { oneMinuteCarePlan } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function CarePlanPreview() {
  return (
    <div className="care-plan-preview stack">
      <div className="row wrap">
        <div>
          <h3>1분 해결 플랜</h3>
          <p>사용자는 걱정만 고르고, 앱과 운영실이 해결 플랜으로 바꿉니다.</p>
        </div>
        <StatusBadge label="40대 이상 맞춤" tone="safe" />
      </div>
      <div className="care-plan-grid">
        {oneMinuteCarePlan.map((step) => (
          <div className="care-plan-step" key={step.order}>
            <span>{step.order}</span>
            <strong>{step.title}</strong>
            <p>{step.description}</p>
            <small>{step.dueHint}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
