import { convenienceMetrics } from "@/lib/demo-data";
import { DocumentRequestPanel } from "./DocumentRequestPanel";
import { FamilyActionBoard } from "./FamilyActionBoard";
import { HospitalGuideCard } from "./HospitalGuideCard";
import { KpiStrip } from "./KpiStrip";
import { MedicationReminderPanel } from "./MedicationReminderPanel";
import { NextVisitPlanner } from "./NextVisitPlanner";
import { PrepPackPanel } from "./PrepPackPanel";
import { StatusBadge } from "./StatusBadge";

export function ConvenienceHub() {
  return (
    <div className="stack">
      <section className="hero-card stack convenience-hero">
        <div className="kicker">생활 편의 레이어</div>
        <h1>병원 가는 날의 잔일을 앱이 미리 정리합니다.</h1>
        <p>
          예약 자체보다 더 귀찮은 것은 준비물, 복용약, 서류, 비용, 다음 예약, 가족 역할 분담입니다.
          이 레이어는 안전 기능 위에 얹는 실생활 편의 기능입니다.
        </p>
        <div className="row wrap" style={{ justifyContent: "flex-start" }}>
          <StatusBadge label="준비물 자동 체크" tone="safe" />
          <StatusBadge label="병원 동선 가이드" tone="safe" />
          <StatusBadge label="서류·영수증 요청" tone="safe" />
          <StatusBadge label="복약 확인" tone="warn" />
          <StatusBadge label="다음 예약 초안" tone="safe" />
        </div>
      </section>

      <KpiStrip metrics={convenienceMetrics} />
      <PrepPackPanel />
      <HospitalGuideCard />
      <div className="grid two">
        <DocumentRequestPanel />
        <MedicationReminderPanel />
      </div>
      <div className="grid two">
        <NextVisitPlanner />
        <FamilyActionBoard />
      </div>
    </div>
  );
}
