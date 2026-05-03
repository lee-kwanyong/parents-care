import { worryCarePlanSteps } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function WorryCarePlanPanel() {
  return (
    <section className="panel stack worry-plan-panel">
      <div>
        <div className="kicker">걱정 → 케어 플랜</div>
        <h2>사용자는 걱정만 말하고, 앱이 필요한 일을 정리합니다.</h2>
        <p>병원, 식사, 약, 서류, 퇴원, 정기케어를 각각 따로 찾게 하지 않고 운영실 해결 플랜으로 묶습니다.</p>
      </div>
      <div className="grid four compact-grid">
        {worryCarePlanSteps.map((step) => (
          <div className="mini-card" key={step.id}>
            <div className="row wrap"><strong>{step.title}</strong><StatusBadge label={step.status === "done" ? "완료" : step.status === "in_progress" ? "진행" : "대기"} tone={step.status === "done" ? "safe" : step.status === "in_progress" ? "warn" : "neutral"} /></div>
            <span>{step.description}</span>
            <small>{step.owner} · {step.due}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
