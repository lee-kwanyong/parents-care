import { simpleUxPrinciples } from "@/lib/constants";
import { Section } from "./Section";

export function SimpleModeGuardrail() {
  return (
    <Section title="40대 이상 사용자를 위한 개발 원칙" description="기능은 제대로 만들지만, 고객 화면은 간단하게 유지합니다.">
      <div className="grid three compact-grid">
        {simpleUxPrinciples.map((principle, index) => (
          <div className="mini-card" key={principle}>
            <strong>{index + 1}. 쉬움 기준</strong>
            <span>{principle}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
