import { CarePassportPanel } from "@/components/CarePassportPanel";
import { Section } from "@/components/Section";

export default function CarePassportPage() {
  return (
    <main className="stack">
      <CarePassportPanel />
      <Section title="왜 케어패스포트가 차별화인가요?" description="한 번 이용할수록 부모님을 더 잘 알고, 다음 서비스 품질이 좋아지는 구조입니다.">
        <div className="grid three">
          <div className="mini-card"><strong>부모님 부담 감소</strong><span>매번 같은 설명을 반복하지 않아도 됩니다.</span></div>
          <div className="mini-card"><strong>매니저 품질 향상</strong><span>거동, 식사, 약, 응대 방식을 알고 현장에 갑니다.</span></div>
          <div className="mini-card"><strong>운영 리스크 감소</strong><span>낙상, 약, 민감정보 공유 범위를 사전에 확인합니다.</span></div>
        </div>
      </Section>
    </main>
  );
}
