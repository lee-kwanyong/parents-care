import type { AssignmentCandidate, ManagerTrustSummary, RiskFlag, TransportMode } from "./types";

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function calculateTrustScore(input: {
  ratingAverage: number;
  completedCount: number;
  reportQualityScore: number;
  openRiskCount: number;
  verifiedBadgeCount: number;
}) {
  const ratingBase = input.ratingAverage * 16;
  const completionBonus = Math.min(input.completedCount * 0.08, 10);
  const qualityBonus = input.reportQualityScore * 0.08;
  const verificationBonus = Math.min(input.verifiedBadgeCount * 1.5, 8);
  const riskPenalty = input.openRiskCount * 7;
  return Math.round(clamp(ratingBase + completionBonus + qualityBonus + verificationBonus - riskPenalty));
}

export function calculateManagerFitScore(candidate: Omit<AssignmentCandidate, "fitScore" | "recommendation" | "reason">) {
  let score = candidate.trustScore;
  score += candidate.regionMatch ? 12 : -10;
  score += candidate.specialtyMatch * 8;
  score += Math.max(0, 12 - candidate.distanceKm * 1.2);
  score += candidate.available ? 8 : -20;
  score -= candidate.scheduleConflict ? 25 : 0;
  score -= candidate.riskPenalty;

  const reasons: string[] = [];
  if (candidate.regionMatch) reasons.push("가능 지역 일치");
  if (candidate.specialtyMatch >= 0.8) reasons.push("진료과 전문분야 강함");
  if (candidate.trustScore >= 90) reasons.push("안심도 90점 이상");
  if (candidate.reportQualityScore && candidate.reportQualityScore >= 90) reasons.push("리포트 품질 우수");
  if (!candidate.directTransportAllowed && candidate.hasVehicle) reasons.push("차량 보유와 직접 운송을 분리 표시");
  if (candidate.scheduleConflict) reasons.push("시간 충돌 검토 필요");
  if (candidate.openRiskCount && candidate.openRiskCount > 0) reasons.push("미해결 위험 플래그 확인 필요");

  const fitScore = Math.round(clamp(score));
  const recommendation = fitScore >= 82 && !candidate.scheduleConflict && candidate.available
    ? "auto_recommend"
    : fitScore >= 64
      ? "manual_review"
      : "do_not_assign";

  return { fitScore, recommendation, reason: reasons } as const;
}

export function enrichAssignmentCandidate(candidate: Omit<AssignmentCandidate, "fitScore" | "recommendation" | "reason">): AssignmentCandidate {
  const computed = calculateManagerFitScore(candidate);
  return { ...candidate, ...computed };
}

export function detectTransportRisks(input: {
  transportMode: TransportMode;
  manager?: ManagerTrustSummary;
  parentConsentComplete: boolean;
  medicalDetailShared: boolean;
}): RiskFlag[] {
  const risks: RiskFlag[] = [];

  if (input.transportMode === "manager_vehicle_info_only") {
    risks.push({
      id: "risk-vehicle-copy",
      severity: "medium",
      status: "open",
      code: "VEHICLE_INFO_CONFUSION",
      title: "차량 보유 정보가 직접 운송으로 오해될 수 있음",
      description: "보호자와 부모님 화면에 차량 보유와 직접 운송 가능 여부를 분리해서 재노출해야 합니다.",
      owner: "운영실",
      due: "배정 확정 전",
      playbook: ["자녀앱 정책 문구 확인", "부모님앱 이동 방식 문구 확인", "알림톡 템플릿에 택시 동행 문구 삽입"]
    });
  }

  if (input.transportMode === "direct_transport_partner" && !input.manager?.directTransportAllowed) {
    risks.push({
      id: "risk-direct-transport",
      severity: "critical",
      status: "open",
      code: "DIRECT_TRANSPORT_NOT_VERIFIED",
      title: "직접 운송 검증이 없는 매니저",
      description: "직접 운송 제휴 서비스는 계약·보험·자격 검증된 별도 서비스에만 허용됩니다.",
      owner: "운영실 책임자",
      due: "즉시",
      playbook: ["배정 중단", "제휴 이동지원으로 전환", "보호자에게 이동 방식 변경 안내"]
    });
  }

  if (!input.parentConsentComplete) {
    risks.push({
      id: "risk-consent",
      severity: "high",
      status: "reviewing",
      code: "CONSENT_PENDING",
      title: "동행·정보공유 동의 미완료",
      description: "진행상황과 리포트를 공유하기 전에 동의 범위를 확인해야 합니다.",
      owner: "상담 운영자",
      due: "만남 30분 전",
      playbook: ["부모님앱에서 큰 글씨 동의 확인", "자녀에게 공유 범위 재확인", "동의 로그 저장"]
    });
  }

  if (input.medicalDetailShared && !input.parentConsentComplete) {
    risks.push({
      id: "risk-medical-detail",
      severity: "critical",
      status: "open",
      code: "MEDICAL_DETAIL_WITHOUT_CONSENT",
      title: "민감정보 상세 공유 전 동의 필요",
      description: "검사·약 상세 등 민감정보는 별도 공유 범위 확인 후 노출해야 합니다.",
      owner: "개인정보 보호 담당",
      due: "리포트 발송 전",
      playbook: ["리포트 상세 비공개", "요약만 우선 발송", "별도 동의 수집"]
    });
  }

  return risks;
}

export function formatScoreLabel(score: number) {
  if (score >= 90) return "최우선 추천";
  if (score >= 80) return "추천";
  if (score >= 65) return "운영실 검토";
  return "배정 보류";
}
