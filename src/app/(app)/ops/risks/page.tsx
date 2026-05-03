import { BackupDispatchPanel } from "@/components/BackupDispatchPanel";
import { PolicyGuardrail } from "@/components/PolicyGuardrail";
import { RiskTriageBoard } from "@/components/RiskTriageBoard";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";

export default function OpsRisksPage() {
  return (
    <main className="stack">
      <section className="hero-card stack">
        <div className="row wrap">
          <div>
            <div className="kicker">운영실 · 사고/법무/운영 리스크 보드</div>
            <h1>위험 플래그를 발견하는 것에서 끝내지 않고 playbook으로 닫습니다.</h1>
            <p>직접 운송 오해, 동의 누락, 민감정보 공유, 지연/노쇼, 사고 대응을 한 화면에서 추적합니다.</p>
          </div>
          <StatusBadge label="운영 로그 필수" tone="warn" />
        </div>
      </section>

      <PolicyGuardrail />

      <Section title="리스크 티켓">
        <RiskTriageBoard />
      </Section>

      <Section title="지연·노쇼 대체 배정">
        <BackupDispatchPanel />
      </Section>

      <Section title="운영 로그 예시">
        <div className="table-like">
          {[
            ["09:02", "운영실", "DIRECT_TRANSPORT_REQUESTED", "택시 동행으로 변경 안내 완료"],
            ["09:10", "상담 운영자", "CONSENT_SCOPE_PENDING", "부모님앱 동의 확인 요청"],
            ["12:18", "리포트 검수자", "REPORT_QUALITY_CHECK", "다음 액션 담당자 추가 요청"]
          ].map(([time, actor, code, note]) => (
            <div className="table-row four-col" key={`${time}-${code}`}>
              <strong>{time}</strong><span>{actor}</span><span className="mono">{code}</span><span>{note}</span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
