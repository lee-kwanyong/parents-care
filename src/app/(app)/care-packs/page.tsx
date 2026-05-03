import { CarePackCatalog } from "@/components/CarePackCatalog";
import { CarePlatformNorthStar } from "@/components/CarePlatformNorthStar";
import { Section } from "@/components/Section";
import { SimpleUxPrinciples } from "@/components/SimpleUxPrinciples";

export default function CarePacksPage() {
  return (
    <main className="stack">
      <section className="hero worry-hero">
        <div className="hero-card">
          <div className="kicker">부모님 케어팩</div>
          <h1>병원만이 아니라, 병원 전후의 생활까지 챙깁니다.</h1>
          <p>식사, 약, 퇴원 후 7일, 보험서류, 정기진료, 안부 확인까지 가족이 이해하기 쉬운 묶음으로 선택합니다.</p>
        </div>
        <CarePlatformNorthStar />
      </section>
      <CarePackCatalog />
      <Section title="왜 케어팩인가요?" description="기능을 낱개로 찾지 않아도, 상황에 맞는 조합을 바로 맡길 수 있습니다.">
        <SimpleUxPrinciples />
      </Section>
    </main>
  );
}
