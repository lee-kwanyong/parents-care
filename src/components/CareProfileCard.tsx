import { StatusBadge } from "./StatusBadge";

export function CareProfileCard() {
  return (
    <div className="card stack">
      <div className="row">
        <h3>부모님 케어 프로필</h3>
        <StatusBadge label="공유범위 확인" tone="warn" />
      </div>
      <p>
        매니저가 현장에서 실수하지 않도록 이동, 의사소통, 복약, 주의사항을 한 장으로 정리합니다.
      </p>
      <div className="grid two compact-grid">
        <div className="mini-card"><strong>이동</strong><span>천천히 보행 · 계단 어려움</span></div>
        <div className="mini-card"><strong>의사소통</strong><span>큰 목소리 · 쉬운 단어 선호</span></div>
        <div className="mini-card"><strong>주의</strong><span>무릎 통증 · 오래 서 있기 어려움</span></div>
        <div className="mini-card"><strong>복약</strong><span>혈압약 복용 여부 확인 필요</span></div>
      </div>
    </div>
  );
}
