import { NotificationPreview } from "@/components/NotificationPreview";
import { PolicyGuardrail } from "@/components/PolicyGuardrail";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";
import { reportQualityChecklist } from "@/lib/demo-data";

export default function OpsPoliciesPage() {
  return (
    <main className="stack">
      <section className="hero-card stack">
        <div className="row wrap">
          <div>
            <div className="kicker">운영실 · 정책/알림 템플릿</div>
            <h1>서비스 문구가 법무/운영 정책과 어긋나지 않게 관리합니다.</h1>
            <p>차량 보유, 직접 운송, 동의 범위, 민감정보 공유, 리포트 발송 문구를 통제합니다.</p>
          </div>
          <StatusBadge label="정책 버전 관리" tone="safe" />
        </div>
      </section>

      <PolicyGuardrail />

      <div className="grid two">
        <Section title="알림 템플릿">
          <NotificationPreview />
        </Section>
        <Section title="리포트 품질 기준">
          <div className="check-grid">
            {reportQualityChecklist.map((item) => (
              <div className="check-card" key={item}><StatusBadge label="기준" tone="safe" /><span>{item}</span></div>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
