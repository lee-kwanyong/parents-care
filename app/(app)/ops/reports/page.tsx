import { CareReportCard } from "@/components/CareReportCard";
import { NotificationPreview } from "@/components/NotificationPreview";
import { QualityGatePanel } from "@/components/QualityGatePanel";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";
import { demoReport } from "@/lib/demo-data";

export default function OpsReportsPage() {
  return (
    <main className="stack">
      <section className="hero-card stack">
        <div className="row wrap">
          <div>
            <div className="kicker">운영실 · 리포트 검수/발송</div>
            <h1>보호자에게 발송되기 전, 리포트 품질과 공유 범위를 검수합니다.</h1>
            <p>진료 진행 내용, 의료진 안내사항, 검사/약/다음 예약, 비용, 부모님 컨디션, 다음 액션을 빠짐없이 확인합니다.</p>
          </div>
          <StatusBadge label="발송 전 검수" tone="warn" />
        </div>
      </section>

      <div className="grid two">
        <CareReportCard report={demoReport} />
        <div className="stack">
          <QualityGatePanel />
          <Section title="발송 전 확인">
            <div className="check-grid">
              {["민감정보 공유 동의 확인", "의학적 판단 표현 제거", "다음 액션 담당자/기한 추가", "비용/영수증 범위 확인"].map((item) => (
                <div className="check-card" key={item}><StatusBadge label="검수" tone="safe" /><span>{item}</span></div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <Section title="보호자 발송 알림">
        <NotificationPreview />
      </Section>
    </main>
  );
}
