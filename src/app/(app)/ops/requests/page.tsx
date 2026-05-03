import { CareRequestBoard } from "@/components/CareRequestBoard";
import { CarePlanPreview } from "@/components/CarePlanPreview";
import { Section } from "@/components/Section";
import { SocialContributionPanel } from "@/components/SocialContributionPanel";

export default function OpsRequestsPage() {
  return (
    <main className="stack">
      <section className="hero">
        <div className="hero-card">
          <div className="kicker">운영실 · 부모님 걱정 요청센터</div>
          <h1>상담원이 할 일은 접수가 아니라 걱정을 해결 플랜으로 바꾸는 것입니다.</h1>
          <p>전화·카톡·사진·직접 입력으로 들어온 요청을 병원, 식사, 약, 퇴원, 서류, 정기진료, 공공지원으로 분류합니다.</p>
        </div>
        <CarePlanPreview />
      </section>

      <Section title="걱정 요청 보드" description="서비스명 모름, 비용 부담, 긴급도, 부모님 거부감까지 같이 봅니다.">
        <CareRequestBoard mode="ops" />
      </Section>

      <SocialContributionPanel />
    </main>
  );
}
