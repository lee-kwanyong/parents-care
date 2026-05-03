import { StatusBadge } from "./StatusBadge";

export function RiskFlagCard() {
  return (
    <div className="card stack risk-card">
      <div className="row">
        <h3>위험상황 빠른 보고</h3>
        <StatusBadge label="운영실 즉시 확인" tone="danger" />
      </div>
      <div className="grid two compact-grid">
        <button type="button" className="danger-choice">보호자 연락 안 됨</button>
        <button type="button" className="danger-choice">부모님 컨디션 이상</button>
        <button type="button" className="danger-choice">병원 일정 지연</button>
        <button type="button" className="danger-choice">동의/신원 확인 문제</button>
      </div>
      <p>응급상황 판단이나 의료행위가 아니라, 운영실과 보호자가 빠르게 대응하도록 상황을 기록하는 기능입니다.</p>
    </div>
  );
}
