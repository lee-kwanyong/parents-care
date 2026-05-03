import { ParentConveniencePanel } from "@/components/ParentConveniencePanel";
import { PwaInstallGuide } from "@/components/PwaInstallGuide";

export default function ParentConveniencePage() {
  return (
    <main className="stack parent-mode">
      <ParentConveniencePanel />
      <PwaInstallGuide />
    </main>
  );
}
