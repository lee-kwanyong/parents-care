import { PwaInstallGuide } from "@/components/PwaInstallGuide";
import { Section } from "@/components/Section";

export default function ParentInstallPage() {
  return (
    <main className="stack parent-mode">
      <section className="hero-card">
        <div className="kicker">부모님앱 설치 안내</div>
        <h1 className="big-text">어머니 폰에 홈 화면 앱처럼 설치합니다.</h1>
        <p>부모님앱은 오늘 일정, 만나는 매니저, 만남 암호, 자녀 전화, 긴급 도움 버튼만 단순하게 보여줍니다.</p>
      </section>
      <Section title="설치 순서">
        <PwaInstallGuide />
      </Section>
    </main>
  );
}
