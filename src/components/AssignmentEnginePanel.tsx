import { assignmentCandidates } from "@/lib/demo-data";
import { formatScoreLabel } from "@/lib/product-logic";
import { StatusBadge } from "./StatusBadge";

function recommendationTone(recommendation: string) {
  if (recommendation === "auto_recommend") return "safe" as const;
  if (recommendation === "manual_review") return "warn" as const;
  return "danger" as const;
}

function recommendationLabel(recommendation: string) {
  if (recommendation === "auto_recommend") return "자동 추천";
  if (recommendation === "manual_review") return "운영 검토";
  return "배정 보류";
}

export function AssignmentEnginePanel() {
  return (
    <div className="stack">
      {assignmentCandidates.map((candidate) => (
        <article className="candidate-card" key={candidate.id ?? candidate.name}>
          <div className="candidate-score" aria-label={`${candidate.name} 적합도 ${candidate.fitScore}점`}>
            <strong>{candidate.fitScore}</strong>
            <span>{formatScoreLabel(candidate.fitScore)}</span>
          </div>
          <div className="stack">
            <div className="row wrap">
              <div>
                <h3>{candidate.name}</h3>
                <p>{candidate.regions.join(" · ")} / {candidate.specialties.join(" · ")}</p>
              </div>
              <StatusBadge label={recommendationLabel(candidate.recommendation)} tone={recommendationTone(candidate.recommendation)} />
            </div>
            <div className="mini-metrics">
              <span>안심도 {candidate.trustScore}</span>
              <span>거리 {candidate.distanceKm}km</span>
              <span>전문분야 {Math.round(candidate.specialtyMatch * 100)}%</span>
              <span>{candidate.available ? "가능" : "불가"}</span>
              <span>{candidate.hasVehicle ? "차량 보유" : "차량 없음"}</span>
              <span>{candidate.directTransportAllowed ? "직접 운송 검증" : "직접 운송 미포함"}</span>
            </div>
            <ul className="feature-list">
              {candidate.reason.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}
