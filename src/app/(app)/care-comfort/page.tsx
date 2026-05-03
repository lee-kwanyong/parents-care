import { CareComfortPanel } from "@/components/CareComfortPanel";
import { ParentSimpleCarePanel } from "@/components/ParentSimpleCarePanel";
import { VoiceSummaryCard } from "@/components/VoiceSummaryCard";
import { Section } from "@/components/Section";

export default function CareComfortPage() {
  return (
    <main className="stack">
      <CareComfortPanel />
      <div className="grid two">
        <VoiceSummaryCard />
        <ParentSimpleCarePanel />
      </div>
      <Section title="비용 불안 제거" description="사용자가 불편해하는 추가비용은 보호자 승인 후 진행합니다.">
        <div className="grid four compact-grid">
          <div className="mini-card"><strong>동행비</strong><span>예약 전 명확히 표시</span></div>
          <div className="mini-card"><strong>택시비</strong><span>실비, 사전 안내</span></div>
          <div className="mini-card"><strong>서류 발급비</strong><span>병원 실비, 승인 후 진행</span></div>
          <div className="mini-card"><strong>식사 배송</strong><span>선택 시 별도 승인</span></div>
        </div>
      </Section>
    </main>
  );
}
