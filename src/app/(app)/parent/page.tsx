import { ActionList } from "@/components/ActionList";
import { ComfortCard } from "@/components/ComfortCard";
import { ConsentCard } from "@/components/ConsentCard";
import { ConsentScopeSelector } from "@/components/ConsentScopeSelector";
import { EmergencyButton } from "@/components/EmergencyButton";
import { ManagerTrustCard } from "@/components/ManagerTrustCard";
import { ParentConveniencePanel } from "@/components/ParentConveniencePanel";
import { PwaInstallGuide } from "@/components/PwaInstallGuide";
import { ParentSimpleCarePanel } from "@/components/ParentSimpleCarePanel";
import { SafetyHandoffPanel } from "@/components/SafetyHandoffPanel";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";
import { demoAppointment } from "@/lib/demo-data";

const parentActions = [
  {
    title: "만나는 사람 확인",
    description: `김안심 매니저 사진과 이름을 보고 만남 암호 ${demoAppointment.meetingCode}을 확인합니다.`,
    owner: "어머니",
    due: "08:40",
    status: "가장 중요",
    tone: "safe" as const
  },
  {
    title: "택시 타기 전 확인",
    description: "이동은 택시 동행이며 매니저 개인차량을 타는 기본 서비스가 아닙니다.",
    owner: "어머니·매니저",
    due: "08:50",
    status: "확인",
    tone: "warn" as const
  },
  {
    title: "불편한 점 말하기",
    description: "무릎 통증, 어지러움, 화장실 필요 등은 버튼으로 바로 알릴 수 있습니다.",
    owner: "어머니",
    due: "언제든지",
    status: "상시",
    tone: "neutral" as const
  }
];

export default function ParentPage() {
  return (
    <main className="stack parent-mode">
      <section className="hero-card stack">
        <div className="kicker">부모님앱 · 큰 글씨 안심 화면</div>
        <h1 className="big-text">오늘 오전 8시 40분, 집 앞에서 김안심 매니저를 만납니다.</h1>
        <p>만나면 아래 암호를 서로 확인하세요. 모르는 사람이 오면 긴급 연락 버튼을 누르세요.</p>
        <div className="card row passcode-card">
          <strong>{demoAppointment.meetingCode}</strong>
          <StatusBadge label="오늘의 만남 암호" tone="safe" />
        </div>
        <div className="parent-quick-actions">
          <a className="big-call-button" href="tel:01000000000">자녀에게 전화</a>
          <a className="big-call-button danger" href="tel:119">119 긴급 전화</a>
        </div>
        <EmergencyButton />
      </section>

      <ParentSimpleCarePanel />

      <SafetyHandoffPanel audience="parent" />

      <ParentConveniencePanel />

      <div className="grid two">
        <ComfortCard />
        <div className="card stack">
          <h3>오늘 이것만 기억하세요</h3>
          <div className="large-step"><span>1</span> 매니저 이름과 얼굴 확인</div>
          <div className="large-step"><span>2</span> 만남 암호 {demoAppointment.meetingCode} 말하기</div>
          <div className="large-step"><span>3</span> 택시로 함께 병원 이동</div>
          <div className="large-step"><span>4</span> 불편하면 빨간 버튼 누르기</div>
        </div>
      </div>

      <div className="grid two">
        <ManagerTrustCard />
        <ConsentCard />
      </div>

      <ConsentScopeSelector />

      <div className="grid two">
        <Section title="오늘 해야 할 일">
          <ActionList items={parentActions} />
        </Section>
        <Section title="불편한 점 바로 알리기" description="긴 문장을 입력하지 않아도 현장 상황을 매니저와 자녀에게 전달합니다.">
          <div className="grid two compact-grid">
            <button type="button" className="large-choice">다리가 아파요</button>
            <button type="button" className="large-choice">화장실 가고 싶어요</button>
            <button type="button" className="large-choice">물이 필요해요</button>
            <button type="button" className="large-choice">잠깐 쉬고 싶어요</button>
          </div>
        </Section>
      </div>

      <Section title="진행상황 확인">
        <div className="grid three">
          <div className="card stack"><StatusBadge label="예정" /><h3>집 앞 만남</h3><p>08:40</p></div>
          <div className="card stack"><StatusBadge label="예정" tone="warn" /><h3>택시 동행</h3><p>08:50</p></div>
          <div className="card stack"><StatusBadge label="대기" /><h3>병원 접수</h3><p>09:30</p></div>
        </div>
      </Section>

      <PwaInstallGuide />
    </main>
  );
}
