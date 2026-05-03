import { platformDifferentiators } from "@/lib/demo-data";

export function CareDifferentiatorPanel() {
  return (
    <section className="differentiator-panel stack" aria-labelledby="difference-title">
      <div>
        <div className="kicker">차별화 기준</div>
        <h2 id="difference-title">우리는 매칭앱이 아니라 부모님 걱정 해결 플랫폼입니다.</h2>
        <p>대리운전식 매칭과 달라지려면 ‘사람 연결’보다 ‘걱정 접수 → 해결 플랜 → 생활 케어’가 제품의 중심이어야 합니다.</p>
      </div>
      <div className="differentiator-grid">
        {platformDifferentiators.map((item) => (
          <article className="differentiator-card" key={item.title}>
            <strong>{item.title}</strong>
            <div className="compare-box old">
              <span>기존 관점</span>
              <p>{item.oldView}</p>
            </div>
            <div className="compare-box ours">
              <span>우리 관점</span>
              <p>{item.ourView}</p>
            </div>
            <small>{item.whyItMatters}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
