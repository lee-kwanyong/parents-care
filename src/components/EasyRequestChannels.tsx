import Link from "next/link";
import { easyRequestChannels } from "@/lib/demo-data";
import { Section } from "./Section";

export function EasyRequestChannels() {
  return (
    <Section title="앱을 못 써도 맡길 수 있게" description="40대 이상 보호자에게 직접 입력만 강요하지 않습니다. 전화·카톡·사진이 먼저입니다.">
      <div className="grid four compact-grid">
        {easyRequestChannels.map((channel) => (
          <Link href="/child/worry" className="mini-card easy-channel" key={channel.code}>
            <strong>{channel.title}</strong>
            <span>{channel.description}</span>
            <small>{channel.bestFor}</small>
          </Link>
        ))}
      </div>
    </Section>
  );
}
