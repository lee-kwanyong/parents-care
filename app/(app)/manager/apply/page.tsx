import { ManagerApplicationForm } from "@/components/ManagerApplicationForm";
import { PolicyGuardrail } from "@/components/PolicyGuardrail";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";

export default function ManagerApplyPage() {
  return (
    <main className="stack">
      <section className="hero-card stack">
        <div className="row wrap">
          <div>
            <div className="kicker">동행매니저앱 · 지원서</div>
            <h1>차량 보유, 가능 지역, 전문분야, 경력/자격을 분리해서 받습니다.</h1>
            <p>매니저 개인차량 직접 유상운송은 기본 서비스와 분리하고, 별도 제휴/계약/보험 검증 전까지 직접 운송 가능으로 노출하지 않습니다.</p>
          </div>
          <StatusBadge label="운영실 심사" tone="warn" />
        </div>
      </section>
      <PolicyGuardrail />
      <Section title="매니저 지원 정보">
        <ManagerApplicationForm />
      </Section>
    </main>
  );
}
