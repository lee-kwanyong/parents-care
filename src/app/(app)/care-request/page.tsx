import { CarePlanPreview } from "@/components/CarePlanPreview";
import { CareRequestBoard } from "@/components/CareRequestBoard";
import { Section } from "@/components/Section";
import { SimpleUxPrinciples } from "@/components/SimpleUxPrinciples";
import { WorryIntakeHub } from "@/components/WorryIntakeHub";

export default function CareRequestPage() {
  return (
    <main className="stack">
      <section className="hero worry-hero">
        <div className="hero-card">
          <div className="kicker">부모님 걱정 해결 앱</div>
          <h1>기능을 고르지 말고, 걱정을 맡기세요.</h1>
          <p>
            40대 이상 사용자는 복잡한 폼을 배우고 싶지 않습니다. 전화·카톡·사진·간단입력 중 편한 방식으로 맡기면,
            앱과 운영실이 병원·밥·약·퇴원·서류·정기진료 플랜으로 정리합니다.
          </p>
        </div>
        <CarePlanPreview />
      </section>

      <WorryIntakeHub />

      <div className="grid two">
        <Section title="이미 접수된 걱정" description="가족은 진행상황을 해석하지 않고 다음 단계만 확인합니다.">
          <CareRequestBoard />
        </Section>
        <Section title="간단함을 지키는 원칙" description="기능을 늘려도 사용자 경험은 단순해야 합니다.">
          <SimpleUxPrinciples />
        </Section>
      </div>
    </main>
  );
}
