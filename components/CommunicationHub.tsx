import { StatusBadge } from "./StatusBadge";

const messages = [
  { from: "운영실", text: "김안심 매니저 배정이 확정되었습니다.", time: "어제 18:20" },
  { from: "매니저", text: "집 앞 도착 10분 전에 다시 안내드리겠습니다.", time: "오늘 08:20" },
  { from: "자녀", text: "어머니가 무릎이 불편하셔서 대기 중 앉을 곳을 부탁드립니다.", time: "오늘 08:22" }
];

export function CommunicationHub() {
  return (
    <div className="card stack">
      <div className="row">
        <h3>가족·매니저 소통함</h3>
        <StatusBadge label="기록 보관" tone="safe" />
      </div>
      <p>전화로 흩어지는 내용을 일정별 대화와 운영 로그로 남깁니다.</p>
      <div className="stack">
        {messages.map((message) => (
          <div className="message" key={`${message.from}-${message.time}`}>
            <strong>{message.from}</strong>
            <span>{message.text}</span>
            <small>{message.time}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
