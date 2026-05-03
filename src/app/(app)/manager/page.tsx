import { ManagerConvenienceAssist } from "@/components/ManagerConvenienceAssist";
import { ManagerFieldConsole } from "@/components/ManagerFieldConsole";
import { ManagerTrustCard } from "@/components/ManagerTrustCard";
import { SafetyHandoffPanel } from "@/components/SafetyHandoffPanel";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";
import { VehiclePolicyNotice } from "@/components/VehiclePolicyNotice";
import { demoAppointment } from "@/lib/demo-data";

export default function ManagerTodayPage() {
  return (
    <main className="stack">
      <section className="hero">
        <div className="hero-card stack">
          <div className="kicker">동행매니저앱 · 오늘 배정</div>
          <h1>{demoAppointment.elderName} 병원동행 현장 콘솔</h1>
          <p>{demoAppointment.meetAt} · {demoAppointment.meetPlace}에서 만남 암호 {demoAppointment.meetingCode}를 확인합니다.</p>
          <div className="row wrap" style={{ justifyContent: "flex-start" }}>
            <StatusBadge label={demoAppointment.hospitalName} tone="neutral" />
            <StatusBadge label={demoAppointment.department} tone="safe" />
            <StatusBadge label={demoAppointment.pickupLabel} tone="warn" />
          </div>
        </div>
        <ManagerTrustCard />
      </section>

      <VehiclePolicyNotice />

      <ManagerConvenienceAssist />

      <SafetyHandoffPanel audience="manager" />

      <Section title="현장 수행" description="상태 업데이트와 리포트 초안은 Supabase Server Action으로 연결되어 있습니다.">
        <ManagerFieldConsole />
      </Section>
    </main>
  );
}
