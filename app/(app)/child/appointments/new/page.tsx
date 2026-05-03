import { Section } from "@/components/Section";
import { SmartAppointmentForm } from "@/components/SmartAppointmentForm";
import { StatusBadge } from "@/components/StatusBadge";

export default function NewAppointmentPage() {
  return (
    <main className="stack">
      <section className="hero-card stack">
        <div className="row wrap">
          <div>
            <div className="kicker">자녀앱 · 병원 일정 등록</div>
            <h1>부모님 병원동행 일정을 실제 DB 구조에 맞게 등록합니다.</h1>
            <p>일정, 만남 장소, 이동 방식, 보호자 질문, 공유 범위, 차량 정책 확인을 한 번에 저장합니다.</p>
          </div>
          <StatusBadge label="Server Action 준비" tone="safe" />
        </div>
      </section>

      <Section title="새 병원동행 일정" description="Supabase 환경변수와 로그인/가족/부모님 프로필이 준비되면 appointments, appointment_questions, audit_logs에 저장됩니다.">
        <SmartAppointmentForm />
      </Section>
    </main>
  );
}
