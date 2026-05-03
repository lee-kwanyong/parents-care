import { MealCarePanel } from "@/components/MealCarePanel";
import { ParentSimpleCarePanel } from "@/components/ParentSimpleCarePanel";
import { RecurringCarePanel } from "@/components/RecurringCarePanel";
import { Section } from "@/components/Section";

export default function CareMealPage() {
  return (
    <main className="stack">
      <MealCarePanel />
      <Section title="부모님 화면은 이렇게 단순하게" description="부모님은 식사관리 앱을 배우지 않고 큰 버튼만 누릅니다.">
        <div className="parent-mode panel stack">
          <h2 className="big-text">점심 드셨어요?</h2>
          <div className="parent-quick-actions">
            <button className="big-call-button" type="button">먹었어요</button>
            <button className="big-call-button danger" type="button">못 먹었어요</button>
          </div>
        </div>
      </Section>
      <RecurringCarePanel />
      <ParentSimpleCarePanel />
    </main>
  );
}
