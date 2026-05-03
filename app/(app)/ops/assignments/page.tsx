import { AssignmentEnginePanel } from "@/components/AssignmentEnginePanel";
import { ManagerTrustCard } from "@/components/ManagerTrustCard";
import { PolicyGuardrail } from "@/components/PolicyGuardrail";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";

export default function OpsAssignmentsPage() {
  return (
    <main className="stack">
      <section className="hero-card stack">
        <div className="row wrap">
          <div>
            <div className="kicker">운영실 · 매니저 심사/승인·배정</div>
            <h1>평점순이 아니라 오늘 일정에 맞는 안전한 매니저를 배정합니다.</h1>
            <p>가능 지역, 전문분야, 일정 가능 여부, 안심도, 미해결 리스크, 차량/운송 정책을 함께 봅니다.</p>
          </div>
          <StatusBadge label="배정 전 검토" tone="warn" />
        </div>
      </section>

      <PolicyGuardrail />

      <div className="grid two">
        <Section title="추천 후보">
          <AssignmentEnginePanel />
        </Section>
        <Section title="선택 후보 신뢰카드">
          <ManagerTrustCard />
        </Section>
      </div>

      <Section title="배정 전 체크리스트">
        <div className="check-grid">
          {[
            "지원서 승인 상태 확인",
            "신원/경력/자격 검수 완료",
            "가능 지역과 병원 동선 일치",
            "차량 보유와 직접 운송 가능 여부 분리 노출",
            "동의 범위와 민감정보 공유 범위 확인",
            "미해결 위험 플래그 없음 또는 playbook 지정"
          ].map((item, index) => (
            <div className="check-card" key={item}><StatusBadge label={index < 4 ? "필수" : "검토"} tone={index < 4 ? "safe" : "warn"} /><span>{item}</span></div>
          ))}
        </div>
      </Section>
    </main>
  );
}
