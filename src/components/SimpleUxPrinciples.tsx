import { simpleUxRules } from "@/lib/demo-data";

export function SimpleUxPrinciples() {
  return (
    <div className="simple-ux-panel stack">
      <h3>40대 이상 사용자를 위한 개발 원칙</h3>
      <div className="simple-rule-grid">
        {simpleUxRules.map((rule, index) => (
          <div className="simple-rule" key={rule}>
            <span>{index + 1}</span>
            <strong>{rule}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
