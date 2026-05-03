import { StatusBadge } from "./StatusBadge";

const groups = [
  {
    title: "보호자 기능",
    tone: "safe" as const,
    items: ["일정 등록", "가족 권한", "실시간 진행", "안심 체크인", "리포트", "평가"]
  },
  {
    title: "부모님/환자 기능",
    tone: "safe" as const,
    items: ["큰 글씨", "만남 암호", "안전 종료", "동의", "긴급 연락", "전화 우선"]
  },
  {
    title: "매니저 기능",
    tone: "warn" as const,
    items: ["배정 일정", "암호 확인", "체크포인트", "질문 리스트", "위험 보고", "리포트"]
  },
  {
    title: "운영실 기능",
    tone: "neutral" as const,
    items: ["심사", "추천 배정", "SLA 점검", "위험 플래그", "품질 검수", "정산"]
  }
];

export function FeatureMatrix() {
  return (
    <div className="grid four">
      {groups.map((group) => (
        <div className="card stack" key={group.title}>
          <div className="row">
            <h3>{group.title}</h3>
            <StatusBadge label="필수" tone={group.tone} />
          </div>
          <ul className="feature-list">
            {group.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
