import { MealCarePanel } from "@/components/MealCarePanel";
import { ParentSimpleCarePanel } from "@/components/ParentSimpleCarePanel";
import { Section } from "@/components/Section";

export default function CareMealsPage() {
  return (
    <main className="stack">
      <MealCarePanel />
      <Section title="부모님 화면은 더 단순하게" description="부모님은 앱을 배우는 것이 아니라 큰 버튼만 누르면 됩니다.">
        <ParentSimpleCarePanel />
      </Section>
    </main>
  );
}
