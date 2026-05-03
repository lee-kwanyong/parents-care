import { CarePlanPreview } from "@/components/CarePlanPreview";
import { CareDifferentiatorPanel } from "@/components/CareDifferentiatorPanel";
import { CarePackCatalog } from "@/components/CarePackCatalog";
import { CarePlatformNorthStar } from "@/components/CarePlatformNorthStar";
import { CareRequestBoard } from "@/components/CareRequestBoard";
import { ReassuranceBoard } from "@/components/ReassuranceBoard";
import { Section } from "@/components/Section";
import { SimpleUxPrinciples } from "@/components/SimpleUxPrinciples";
import { SocialContributionPanel } from "@/components/SocialContributionPanel";
import { WorryIntakeHub } from "@/components/WorryIntakeHub";
import { PolicyGuardrail } from "@/components/PolicyGuardrail";
import { RoleCard } from "@/components/RoleCard";
import { StatusBadge } from "@/components/StatusBadge";

export default function HomePage() {
  return (
    <main className="stack">
      <section className="hero worry-hero">
        <div className="hero-card">
          <div className="kicker">부모님 케어 플랫폼</div>
          <h1>부모님 걱정을 쉽게 맡기는 앱.</h1>
          <p>
            이 앱의 핵심 사용자는 40대 이상 자녀입니다. 그래서 기능 메뉴가 아니라 걱정 선택으로 시작합니다.
            병원, 식사, 약, 퇴원, 서류, 정기진료, 안부를 가족 대신 정리해주는 부모님 케어 플랫폼입니다.
          </p>
          <div className="row wrap" style={{ justifyContent: "flex-start" }}>
            <StatusBadge label="3번 안에 완료" tone="safe" />
            <StatusBadge label="전화·카톡·사진 접수" tone="safe" />
            <StatusBadge label="큰 글씨 부모님 화면" tone="safe" />
            <StatusBadge label="사회공헌 연결" tone="warn" />
            <StatusBadge label="차량/운송 분리" tone="warn" />
          </div>
        </div>
        <ReassuranceBoard />
      </section>

      <CarePlatformNorthStar />

      <WorryIntakeHub compact />

      <CareDifferentiatorPanel />

      <CarePackCatalog compact />

      <div className="grid two">
        <Section title="걱정이 해결 플랜으로 바뀌는 과정" description="사용자는 걱정만 말하고, 앱은 다음 액션을 정리합니다.">
          <CarePlanPreview />
        </Section>
        <Section title="40대 이상 맞춤 원칙" description="편리함은 기능 수가 아니라 이해하기 쉬운 흐름에서 나옵니다.">
          <SimpleUxPrinciples />
        </Section>
      </div>

      <PolicyGuardrail />

      <section className="grid four">
        <RoleCard href="/care-request" title="걱정 접수" badge="핵심 시작점" description="병원·밥·약·퇴원·서류·모름 중 하나만 눌러 해결 플랜을 만듭니다." />
        <RoleCard href="/care-passport" title="케어패스포트" badge="부모님 이해" description="거동, 식사, 약, 청력, 말투, 낙상 주의사항을 다음 케어에 반영합니다." />
        <RoleCard href="/care-meals" title="안심밥상" badge="생활 케어" description="식사 확인, 도시락/회복식 연결, 가족 알림을 단순하게 묶습니다." />
        <RoleCard href="/impact" title="사회공헌" badge="돌봄 공백 완화" description="취약가정 쿠폰, 공공지원, 무료 안부, 지역 서비스 연결을 설계합니다." />
      </section>

      <div className="grid two">
        <Section title="접수된 부모님 걱정" description="가족은 진행상태를 해석하지 않고 다음 단계만 확인합니다.">
          <CareRequestBoard />
        </Section>
        <SocialContributionPanel />
      </div>
    </main>
  );
}
