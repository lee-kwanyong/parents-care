import { worryOptions, worryCarePlanSteps, todayAssurance } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function OpsWorryCenter() {
  const intakeRows = [
    { category: "뭘 해야 할지 모르겠어요", channel: "전화", status: "운영실 분류", owner: "상담 운영자", sla: "8분 남음" },
    { category: "밥을 잘 못 챙겨 드세요", channel: "카톡", status: "식사 지원 추천", owner: "식사 파트너 담당", sla: "22분 남음" },
    { category: "퇴원 후 집에서 걱정돼요", channel: "사진", status: "7일팩 견적", owner: "케어 코디네이터", sla: "11분 남음" }
  ];

  return (
    <section className="panel stack ops-worry-center">
      <div className="row wrap">
        <div>
          <div className="kicker">운영실 · 걱정 해결 센터</div>
          <h2>기능 접수가 아니라 걱정을 케어 플랜으로 바꿉니다.</h2>
          <p>보호자가 선택한 걱정을 운영실이 병원, 식사, 약, 서류, 퇴원, 정기케어로 묶어 실행합니다.</p>
        </div>
        <StatusBadge label={`오늘 안심 점수 ${todayAssurance.score}`} tone="safe" />
      </div>
      <div className="grid four compact-grid">
        {worryOptions.slice(0, 4).map((option) => (
          <div className="mini-card" key={option.code}>
            <strong>{option.icon} {option.plainTitle}</strong>
            <span>{option.description}</span>
          </div>
        ))}
      </div>
      <div className="table-like">
        {intakeRows.map((row) => (
          <div className="table-row four-col" key={`${row.category}-${row.channel}`}>
            <strong>{row.category}</strong>
            <span>{row.channel}</span>
            <span>{row.status}</span>
            <span>{row.owner} · {row.sla}</span>
          </div>
        ))}
      </div>
      <div className="grid four compact-grid">
        {worryCarePlanSteps.map((step) => <div className="mini-card" key={step.id}><strong>{step.title}</strong><span>{step.description}</span></div>)}
      </div>
    </section>
  );
}
