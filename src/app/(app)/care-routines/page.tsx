import { RecurringCarePanel } from "@/components/RecurringCarePanel";
import { WorryCarePlanPanel } from "@/components/WorryCarePlanPanel";

export default function CareRoutinesPage() {
  return (
    <main className="stack">
      <RecurringCarePanel />
      <WorryCarePlanPanel />
    </main>
  );
}
