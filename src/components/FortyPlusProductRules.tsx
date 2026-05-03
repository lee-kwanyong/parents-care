import { fortyPlusEasePrinciples } from "@/lib/demo-data";

export function FortyPlusProductRules() {
  return (
    <section className="panel stack" aria-labelledby="forty-plus-title">
      <div>
        <div className="kicker">개발 끝날 때까지 지킬 원칙</div>
        <h2 id="forty-plus-title">사용자는 40대 이상입니다.</h2>
        <p>기능은 제대로 있어야 하지만, 사용 경험은 간편하고 간결해야 합니다. 이 원칙을 통과하지 못하는 기능은 숨기거나 운영실이 대신 처리합니다.</p>
      </div>
      <div className="rule-lock-grid">
        {fortyPlusEasePrinciples.map((principle) => (
          <article className="rule-lock-card" key={principle.label}>
            <span>{principle.label}</span>
            <strong>{principle.rule}</strong>
            <p>{principle.productCheck}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
