import { AssistedIntakeModes } from "@/components/AssistedIntakeModes";
import { CareDifferentiatorPanel } from "@/components/CareDifferentiatorPanel";
import { CarePackCatalog } from "@/components/CarePackCatalog";
import { CarePlatformNorthStar } from "@/components/CarePlatformNorthStar";
import { FortyPlusProductRules } from "@/components/FortyPlusProductRules";
import { PolicyGuardrail } from "@/components/PolicyGuardrail";

export default function CareDifferencePage() {
  return (
    <main className="stack">
      <section className="hero worry-hero">
        <div className="hero-card">
          <div className="kicker">왜 기존 앱보다 써야 하는가</div>
          <h1>차별화는 더 많은 메뉴가 아니라, 더 쉬운 해결입니다.</h1>
          <p>
            부모님 케어 플랫폼의 핵심은 매니저를 연결하는 것이 아니라 40대 이상 가족의 걱정을 받아 병원·식사·약·퇴원·서류·안부 플랜으로 바꾸는 것입니다.
          </p>
        </div>
        <CarePlatformNorthStar />
      </section>

      <CareDifferentiatorPanel />
      <FortyPlusProductRules />
      <AssistedIntakeModes />
      <CarePackCatalog compact />
      <PolicyGuardrail />
    </main>
  );
}
