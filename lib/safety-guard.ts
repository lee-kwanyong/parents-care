import type { RiskFlag, SafetyCheckpoint, SafetyCheckpointCode, SafetyCheckpointStatus } from "./types";

export const safetyCheckpointTone: Record<SafetyCheckpointStatus, "safe" | "warn" | "danger" | "neutral"> = {
  completed: "safe",
  pending: "neutral",
  missed: "danger",
  escalated: "danger",
  skipped: "warn"
};

export const safetyCheckpointStatusLabel: Record<SafetyCheckpointStatus, string> = {
  completed: "완료",
  pending: "대기",
  missed: "놓침",
  escalated: "운영실 확인",
  skipped: "건너뜀"
};

export const requiredSafetyOrder: SafetyCheckpointCode[] = [
  "pre_call",
  "handoff_code",
  "departure_confirmed",
  "hospital_checkin",
  "doctor_consult_update",
  "pharmacy_payment",
  "safe_return_close"
];

export function calculateSafetyReadinessScore(input: {
  checkpoints: SafetyCheckpoint[];
  handoffVerified: boolean;
  safeReturnConfirmed: boolean;
  openEscalationCount: number;
}) {
  const required = input.checkpoints.filter((checkpoint) => checkpoint.visibleToFamily);
  const completed = required.filter((checkpoint) => checkpoint.status === "completed").length;
  const completionBonus = required.length > 0 ? (completed / required.length) * 10 : 0;
  const handoffBonus = input.handoffVerified ? 4 : 0;
  const returnBonus = input.safeReturnConfirmed ? 4 : 0;
  const escalationPenalty = input.openEscalationCount * 18;

  return Math.max(0, Math.min(100, Math.round(82 + completionBonus + handoffBonus + returnBonus - escalationPenalty)));
}

export function getNextRequiredCheckpoint(checkpoints: SafetyCheckpoint[]) {
  return [...checkpoints]
    .sort((a, b) => requiredSafetyOrder.indexOf(a.code) - requiredSafetyOrder.indexOf(b.code))
    .find((checkpoint) => checkpoint.status === "pending" || checkpoint.status === "escalated");
}

export function getSafetyCheckpointTone(status: SafetyCheckpointStatus) {
  return safetyCheckpointTone[status];
}

export function buildMissedCheckpointRisk(checkpoint: SafetyCheckpoint): RiskFlag {
  return {
    id: `risk-${checkpoint.code}`,
    severity: checkpoint.code === "handoff_code" || checkpoint.code === "safe_return_close" ? "high" : "medium",
    status: "open",
    code: "MISSED_SAFETY_CHECKPOINT",
    title: `${checkpoint.label} 업데이트 지연`,
    description: `${checkpoint.expectedAt} 기준 ${checkpoint.graceMinutes}분 안에 필요한 현장 확인이 올라오지 않았습니다. 운영실이 보호자/매니저 연락과 대체 배정을 검토해야 합니다.`,
    owner: checkpoint.escalationOwner,
    due: "즉시",
    playbook: ["매니저 전화 확인", "부모님/자녀 연락", "필요 시 대체 매니저 후보 확인", "운영 로그와 타임라인에 조치 기록"]
  };
}
