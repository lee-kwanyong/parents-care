import Link from "next/link";
import { CareRequestBoard } from "@/components/CareRequestBoard";
import { CarePackCatalog } from "@/components/CarePackCatalog";
import { ReassuranceBoard } from "@/components/ReassuranceBoard";
import { Section } from "@/components/Section";
import { WorryIntakeHub } from "@/components/WorryIntakeHub";
import { ConvenienceQuickSummary } from "@/components/ConvenienceQuickSummary";
import { ManagerTrustCard } from "@/components/ManagerTrustCard";
import { PolicyGuardrail } from "@/components/PolicyGuardrail";

export default function ChildPage() {
  return (
    <main className="stack child-simple-home">
      <section className="hero">
        <div className="hero-card">
          <div className="kicker">자녀앱 · 40대 이상 맞춤</div>
          <h1>엄마, 오늘 괜찮으세요?</h1>
          <p>긴 메뉴를 찾지 않아도 됩니다. 지금 상태를 먼저 보고, 필요한 걱정만 맡기면 됩니다.</p>
          <div className="simple-actions">
            <Link className="button primary-action" href="/care-request">부모님 걱정 맡기기</Link>
            <Link className="ghost-button primary-action" href="/care-packs">케어팩 선택</Link>
            <Link className="ghost-button primary-action" href="/child/appointments/demo">리포트 보기</Link>
            <Link className="ghost-button primary-action" href="/care-passport">케어패스포트</Link>
          </div>
        </div>
        <ManagerTrustCard />
      </section>

      <ReassuranceBoard />
      <WorryIntakeHub compact />

      <div className="grid two">
        <Section title="접수된 부모님 걱정" description="전화·카톡·사진으로 맡긴 내용이 운영실 해결 플랜으로 바뀝니다.">
          <CareRequestBoard />
        </Section>
        <Section title="오늘 빠지면 안 되는 생활 편의" description="준비물, 서류, 약, 다음 예약을 가족 할 일로 정리합니다.">
          <ConvenienceQuickSummary />
        </Section>
      </div>

      <CarePackCatalog compact />

      <PolicyGuardrail />
    </main>
  );
}
