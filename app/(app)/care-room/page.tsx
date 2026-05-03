import { CareRoomBoard } from "@/components/CareRoomBoard";
import { FeatureMatrix } from "@/components/FeatureMatrix";
import { PaymentSummary } from "@/components/PaymentSummary";
import { RiskFlagCard } from "@/components/RiskFlagCard";
import { SafetySlaPanel } from "@/components/SafetySlaPanel";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";

const permissions = [
  ["일정/진행단계", "가족·부모님·매니저·운영실", "기본"],
  ["진료 요약", "동의한 가족·매니저·운영실", "민감"],
  ["약/검사 상세", "선택한 보호자", "선택"],
  ["결제/영수증", "결제자·운영실", "보호자"],
  ["매니저 서류", "매니저 본인·운영실", "비공개"]
];

const sharedModules = [
  ["케어 프로필", "거동, 청력, 시력, 복약, 낙상 위험, 선호 말투를 기록합니다."],
  ["문서함", "예약증, 처방전, 검사 결과, 동의서, 영수증을 일정별로 보관합니다."],
  ["다음 액션", "다음 예약, 약 복용 확인, 보험서류, 보호자 전화 같은 할 일을 만듭니다."],
  ["소통함", "전화로 흩어지는 내용을 일정별 메시지와 운영 로그로 남깁니다."],
  ["알림 설정", "앱, 문자, 알림톡, 전화 우선 모드를 역할별로 선택합니다."],
  ["위험 플래그", "연락 불가, 지연, 컨디션 이상, 동의 누락을 운영실이 확인합니다."]
];

export default function CareRoomPage() {
  return (
    <main className="stack">
      <CareRoomBoard />

      <Section title="모두가 필요한 기능" description="많은 기능을 넣되, 각 역할에는 꼭 필요한 기능만 보이게 나눕니다.">
        <FeatureMatrix />
      </Section>

      <Section title="안심 체크인/SLA" description="만남 암호, 진행 체크포인트, 안전 종료가 끊기지 않도록 가족 케어룸에서도 상태를 봅니다.">
        <SafetySlaPanel />
      </Section>

      <Section title="공동 케어룸 모듈" description="실제 서비스에서는 appointment_id 하나를 중심으로 아래 데이터가 연결됩니다.">
        <div className="grid three">
          {sharedModules.map(([title, text]) => (
            <div className="card stack" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid two">
        <Section title="공유범위와 권한" description="부모님 건강정보는 범위별 동의와 권한 분리가 필요합니다.">
          <div className="table-like">
            {permissions.map(([name, who, badge]) => (
              <div className="table-row three-col" key={name}>
                <strong>{name}</strong>
                <span>{who}</span>
                <StatusBadge label={badge} tone={badge === "민감" ? "warn" : "neutral"} />
              </div>
            ))}
          </div>
        </Section>
        <RiskFlagCard />
      </div>

      <div className="grid two">
        <PaymentSummary />
        <Section title="차량/이동 정책" description="차량 보유와 직접 운송은 UI와 DB에서 분리합니다.">
          <div className="card stack">
            <StatusBadge label="정책 분리" tone="warn" />
            <p>
              차량 보유는 신뢰정보로 표시할 수 있지만, 기본 서비스에서 매니저 개인차량 유상운송으로
              해석되면 안 됩니다. 기본은 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴입니다.
            </p>
          </div>
        </Section>
      </div>
    </main>
  );
}
