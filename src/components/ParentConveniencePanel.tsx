import { hospitalConvenienceGuide, prepPackItems } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function ParentConveniencePanel() {
  const simpleItems = prepPackItems.filter((item) => ["document", "payment", "comfort"].includes(item.category));

  return (
    <section className="convenience-panel parent-convenience stack">
      <div className="row wrap">
        <div>
          <h2>오늘 챙길 것</h2>
          <p>복잡한 설명 없이 출발 전 확인할 것만 크게 보여드립니다.</p>
        </div>
        <StatusBadge label="큰 글씨" tone="safe" />
      </div>
      <div className="grid three compact-grid">
        {simpleItems.map((item) => (
          <div className="large-step" key={item.id}><span>✓</span>{item.title}</div>
        ))}
      </div>
      <div className="card stack">
        <h3>병원에서 어디로 가나요?</h3>
        <p className="big-text">{hospitalConvenienceGuide.mainEntrance}</p>
        <p className="big-text">{hospitalConvenienceGuide.checkinFloor}</p>
      </div>
    </section>
  );
}
