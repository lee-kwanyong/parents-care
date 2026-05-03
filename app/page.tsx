import { AssignmentEnginePanel } from "@/components/AssignmentEnginePanel";
import { CareBlueprint } from "@/components/CareBlueprint";
import { CareRoomBoard } from "@/components/CareRoomBoard";
import { FeatureMatrix } from "@/components/FeatureMatrix";
import { KpiStrip } from "@/components/KpiStrip";
import { PolicyGuardrail } from "@/components/PolicyGuardrail";
import { RoleCard } from "@/components/RoleCard";
import { SafetySlaPanel } from "@/components/SafetySlaPanel";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";
import { opsMetrics } from "@/lib/demo-data";

export default function HomePage() {
  return (
    <main className="stack">
      <section className="hero">
        <div className="hero-card">
          <div className="kicker">150점 제품 방향성</div>
          <h1>부모님 병원동행을 예약앱이 아니라 운영 OS로 만듭니다.</h1>
          <p>
            자녀는 불안을 줄이고, 부모님은 쉽게 확인하고, 매니저는 현장 실수를 줄이고,
            운영실은 리스크와 품질을 관리합니다. 일정 등록부터 동의, 배정, 진행상황, 검수 리포트, 평가까지 하나의 루프로 닫습니다.
          </p>
          <div className="row wrap" style={{ justifyContent: "flex-start" }}>
            <StatusBadge label="Supabase Server Actions" tone="safe" />
            <StatusBadge label="RLS/감사로그" tone="safe" />
            <StatusBadge label="매니저 추천 엔진" tone="safe" />
            <StatusBadge label="리스크 보드" tone="warn" />
            <StatusBadge label="차량/운송 분리" tone="warn" />
            <StatusBadge label="안심 체크인 SLA" tone="safe" />
          </div>
        </div>
        <div className="panel stack">
          <h2>이번 개선의 핵심</h2>
          <ol>
            <li>localStorage 중심에서 Supabase 저장용 Server Actions 구조로 확장했습니다.</li>
            <li>매니저 배정은 지역, 전문분야, 안심도, 리포트 품질, 리스크를 함께 계산합니다.</li>
            <li>리포트는 운영실 품질 게이트를 통과한 뒤 보호자에게 발송됩니다.</li>
            <li>차량 보유는 참고 정보로 표시하고 직접 운송 가능 여부와 분리합니다.</li>
            <li>만남 암호, 안심 체크포인트, 안전 종료 확인으로 현장 공백을 줄입니다.</li>
          </ol>
        </div>
      </section>

      <KpiStrip metrics={opsMetrics} />
      <CareBlueprint />
      <PolicyGuardrail />
      <CareRoomBoard />

      <Section title="추가된 필수 안전장치" description="기능을 늘리기보다, 현장 사고를 줄이는 안심 체크인·SLA·안전 종료 레이어만 더했습니다.">
        <SafetySlaPanel />
      </Section>

      <section className="grid four">
        <RoleCard href="/child" title="자녀앱" badge="예약자/보호자" description="일정 등록, 공동조회 코드, 안심 체크인, 타임라인, 리포트, 평가" />
        <RoleCard href="/parent/today" title="부모님앱" badge="큰 글씨 PWA" description="오늘 일정, 만나는 매니저, 만남 암호, 안전 종료, 자녀 전화, 긴급 도움" />
        <RoleCard href="/manager/today" title="동행매니저앱" badge="현장 수행" description="지원서, 만남 암호 확인, 체크포인트, 질문, 단계 업데이트, 리포트" />
        <RoleCard href="/ops" title="운영실" badge="관리자" description="심사/승인, 배정, 안심 SLA, 위험 플래그, 리포트 검수, 리스크" />
      </section>

      <div className="grid two">
        <Section title="매니저 배정 추천 엔진" description="단순 평점순이 아니라 오늘 일정과 리스크까지 반영합니다.">
          <AssignmentEnginePanel />
        </Section>
        <Section title="역할별 필수 기능" description="많은 기능을 한 화면에 몰지 않고 역할별로 필요한 것만 보여줍니다.">
          <FeatureMatrix />
        </Section>
      </div>
    </main>
  );
}
