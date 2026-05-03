import { DischargeCarePackPanel } from "@/components/DischargeCarePackPanel";
import { CareComfortPanel } from "@/components/CareComfortPanel";
import { VoiceSummaryCard } from "@/components/VoiceSummaryCard";

export default function DischargeCarePage() {
  return (
    <main className="stack">
      <DischargeCarePackPanel />
      <div className="grid two">
        <VoiceSummaryCard />
        <CareComfortPanel />
      </div>
    </main>
  );
}
