import { BackupDispatchPanel } from "@/components/BackupDispatchPanel";
import { SafetyHandoffPanel } from "@/components/SafetyHandoffPanel";
import { SafetyOpsConsole } from "@/components/SafetyOpsConsole";
import { SafetySlaPanel } from "@/components/SafetySlaPanel";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";

export default function OpsSafetyPage() {
  return (
    <main className="stack">
      <section className="hero-card stack">
        <div className="row wrap">
          <div>
            <div className="kicker">운영실 · 안심 체크인/SLA</div>
            <h1>만남 확인이 끊기면 서비스가 아니라 사고로 봅니다.</h1>
            <p>만남 암호, 단계별 체크포인트, 안전 종료 확인, 지연 자동 플래그, 대체 배정 playbook을 한 화면에서 관리합니다.</p>
          </div>
          <StatusBadge label="실제 운영 필수" tone="danger" />
        </div>
      </section>

      <div className="grid two">
        <SafetyHandoffPanel audience="ops" />
        <Section title="SLA 자동 점검 실행">
          <SafetyOpsConsole />
        </Section>
      </div>

      <Section title="필수 체크포인트 상태">
        <SafetySlaPanel />
      </Section>

      <Section title="대체 배정과 사고 대응">
        <BackupDispatchPanel />
      </Section>
    </main>
  );
}
