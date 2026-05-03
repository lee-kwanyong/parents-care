import { CareReportCard } from "@/components/CareReportCard";
import { ManagerTrustCard } from "@/components/ManagerTrustCard";
import { QualityGatePanel } from "@/components/QualityGatePanel";
import { RatingForm } from "@/components/RatingForm";
import { SafetyHandoffPanel } from "@/components/SafetyHandoffPanel";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { VehiclePolicyNotice } from "@/components/VehiclePolicyNotice";
import { demoAppointment, demoReport, demoTimeline } from "@/lib/demo-data";

export default function AppointmentDetailPage() {
  return (
    <main className="stack">
      <section className="hero">
        <div className="hero-card">
          <div className="kicker">병원동행 상세</div>
          <h1>몇 시에 어디서 어떻게 진행되는지 한 화면에서 봅니다.</h1>
          <p>가족 공동조회 코드로 초대된 보호자는 진행 타임라인, 매니저 신뢰카드, 리포트, 평가를 권한 범위 안에서 확인합니다.</p>
          <div className="row wrap" style={{ justifyContent: "flex-start" }}>
            <StatusBadge label={demoAppointment.hospitalName} tone="neutral" />
            <StatusBadge label={`${demoAppointment.department} ${demoAppointment.appointmentAt}`} tone="safe" />
            <StatusBadge label={`만남 암호 ${demoAppointment.meetingCode}`} tone="warn" />
          </div>
        </div>
        <ManagerTrustCard />
      </section>

      <SafetyHandoffPanel audience="child" />

      <div className="grid two">
        <Section title="진행 타임라인" description="매니저 단계 업데이트가 자녀앱, 부모님앱, 운영실 로그에 반영됩니다.">
          <Timeline items={demoTimeline} />
        </Section>
        <VehiclePolicyNotice />
      </div>

      <div className="grid two">
        <CareReportCard report={demoReport} />
        <div className="stack">
          <QualityGatePanel />
          <RatingForm />
        </div>
      </div>
    </main>
  );
}
