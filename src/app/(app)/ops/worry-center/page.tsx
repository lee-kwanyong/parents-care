import { OpsWorryCenter } from "@/components/OpsWorryCenter";
import { SocialContributionPanel } from "@/components/SocialContributionPanel";
import { CareComfortPanel } from "@/components/CareComfortPanel";

export default function OpsWorryCenterPage() {
  return (
    <main className="stack">
      <OpsWorryCenter />
      <div className="grid two">
        <SocialContributionPanel />
        <CareComfortPanel />
      </div>
    </main>
  );
}
