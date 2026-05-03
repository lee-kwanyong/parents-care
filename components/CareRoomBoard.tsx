import { StatusBadge } from "./StatusBadge";

const timeline = [
  ["전날", "준비 확인", "진료카드, 복용약, 금식 여부, 검사 결과지를 가족이 확인합니다."],
  ["만남", "암호 확인", "부모님과 매니저가 만남 암호와 이름/사진을 서로 확인합니다."],
  ["진료", "실시간 공유", "접수, 대기, 진료, 검사, 약국 단계를 보호자가 확인합니다."],
  ["귀가 후", "리포트와 다음 액션", "약, 검사, 다음 예약, 보호자가 해야 할 일을 정리합니다."]
];

const roomCards = [
  ["보호자", "진행상황, 리포트, 다음 액션, 결제/영수증을 확인합니다."],
  ["부모님/환자", "큰 글씨로 오늘 일정, 만남 암호, 긴급 연락만 쉽게 봅니다."],
  ["동행매니저", "케어 프로필, 체크리스트, 병원 가이드, 리포트 템플릿을 씁니다."],
  ["운영실", "배정, 위험 플래그, 정책, 품질검수, 정산을 관리합니다."]
];

export function CareRoomBoard() {
  return (
    <section className="hero-card stack care-room-board">
      <div className="row care-room-head">
        <div>
          <div className="kicker">공동 케어룸</div>
          <h2>한 병원 일정을 네 역할이 각자 편한 화면으로 함께 봅니다.</h2>
          <p>
            제품의 중심은 역할별 앱이 아니라 하나의 케어룸입니다. 같은 일정 데이터를 보호자,
            부모님, 매니저, 운영실에게 필요한 방식으로 다르게 보여줍니다.
          </p>
        </div>
        <StatusBadge label="핵심 구조" tone="safe" />
      </div>

      <div className="grid two">
        <div className="stack">
          {timeline.map(([time, title, text]) => (
            <div className="care-step" key={title}>
              <strong>{time}</strong>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid two compact-grid">
          {roomCards.map(([title, text]) => (
            <div className="mini-card" key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
