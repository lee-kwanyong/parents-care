import { CareComfortPanel } from "@/components/CareComfortPanel";
import { EasyRequestChannels } from "@/components/EasyRequestChannels";
import { Section } from "@/components/Section";
import { SimpleModeGuardrail } from "@/components/SimpleModeGuardrail";
import { WorryCarePlanPanel } from "@/components/WorryCarePlanPanel";
import { WorryIntakeCenter } from "@/components/WorryIntakeCenter";

export default function ChildWorryPage() {
  return (
    <main className="stack">
      <WorryIntakeCenter />
      <EasyRequestChannels />
      <WorryCarePlanPanel />
      <CareComfortPanel />
      <SimpleModeGuardrail />
      <Section title="핵심" description="사용자가 기능명을 몰라도 부모님 걱정을 맡기면 앱과 운영실이 해결 플랜으로 바꿉니다.">
        <div className="grid three compact-grid">
          <div className="mini-card"><strong>기능 대신 걱정</strong><span>병원, 밥, 약, 퇴원, 서류, 정기진료, 잘 모르겠어요.</span></div>
          <div className="mini-card"><strong>입력 대신 맡김</strong><span>전화·카톡·사진으로 접수하고 앱은 결과 확인 도구가 됩니다.</span></div>
          <div className="mini-card"><strong>리포트 대신 다음 행동</strong><span>가족이 해야 할 일, 비용 승인, 다음 예약까지 자동 정리합니다.</span></div>
        </div>
      </Section>
    </main>
  );
}
