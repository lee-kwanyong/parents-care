import { SocialContributionPanel } from "@/components/SocialContributionPanel";
import { Section } from "@/components/Section";

export default function ImpactPage() {
  return (
    <main className="stack">
      <SocialContributionPanel />
      <Section title="사회공헌이 제품 안에 들어가는 방식" description="돈이 큰 목적이 아니라면 운영 정책과 화면 설계에도 배려가 들어가야 합니다.">
        <div className="grid three">
          <div className="mini-card"><strong>비용 부담 표시</strong><span>추가 비용은 보호자 승인 후 진행하고, 공공지원 후보를 안내합니다.</span></div>
          <div className="mini-card"><strong>무료 안부 루틴</strong><span>돌봄 공백이 큰 가정은 주 1회 안부 확인을 캠페인으로 운영할 수 있습니다.</span></div>
          <div className="mini-card"><strong>지역 자원 연결</strong><span>도시락, 복지관, 방문요양, 병원동행 공공서비스를 운영실이 연결합니다.</span></div>
        </div>
      </Section>
    </main>
  );
}
