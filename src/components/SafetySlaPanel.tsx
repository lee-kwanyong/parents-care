import { demoSafetyHandoff, safetyCheckpoints, safetyEscalations } from "@/lib/demo-data";
import { calculateSafetyReadinessScore, getNextRequiredCheckpoint, getSafetyCheckpointTone, safetyCheckpointStatusLabel } from "@/lib/safety-guard";
import { StatusBadge } from "./StatusBadge";

export function SafetySlaPanel() {
  const nextCheckpoint = getNextRequiredCheckpoint(safetyCheckpoints);
  const score = calculateSafetyReadinessScore({
    checkpoints: safetyCheckpoints,
    handoffVerified: demoSafetyHandoff.handoffVerified,
    safeReturnConfirmed: demoSafetyHandoff.safeReturnConfirmed,
    openEscalationCount: safetyEscalations.filter((item) => item.status === "open" || item.status === "acknowledged").length
  });

  return (
    <div className="safety-sla-panel stack">
      <div className="row wrap">
        <div>
          <h3>안심 SLA 체크포인트</h3>
          <p>각 단계가 예정 시간과 grace time 안에 완료되지 않으면 운영실 리스크로 올라갑니다.</p>
        </div>
        <div className="candidate-score small">
          <strong>{score}</strong>
          <span>SLA</span>
        </div>
      </div>

      <div className="mini-card safety-next-card">
        <span>다음 필수 확인</span>
        <strong>{nextCheckpoint ? `${nextCheckpoint.expectedAt} · ${nextCheckpoint.label}` : "모든 안전 확인 완료"}</strong>
        <small>{nextCheckpoint ? `${nextCheckpoint.graceMinutes}분 지연 시 ${nextCheckpoint.escalationOwner}에게 자동 플래그` : "운영실 종료 검수 가능"}</small>
      </div>

      <div className="check-grid safety-check-grid">
        {safetyCheckpoints.map((checkpoint) => (
          <div className="check-card safety-check-card" key={checkpoint.code}>
            <StatusBadge label={safetyCheckpointStatusLabel[checkpoint.status]} tone={getSafetyCheckpointTone(checkpoint.status)} />
            <span>{checkpoint.expectedAt} · {checkpoint.label}</span>
            <small>{checkpoint.graceMinutes}분 grace · 담당 {checkpoint.escalationOwner}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
