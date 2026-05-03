import { HospitalGuideCard } from "@/components/HospitalGuideCard";
import { OpsConvenienceDesk } from "@/components/OpsConvenienceDesk";
import { Section } from "@/components/Section";

export default function OpsConveniencePage() {
  return (
    <main className="stack">
      <OpsConvenienceDesk />
      <Section title="병원별 편의 데이터" description="병원별로 접수층, 휠체어, 약국, 주차, 귀가 대기 위치를 운영실이 관리합니다.">
        <HospitalGuideCard />
      </Section>
    </main>
  );
}
