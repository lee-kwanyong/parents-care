import { socialCarePrograms } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function SocialContributionPanel() {
  return (
    <section className="impact-panel stack" aria-labelledby="impact-title">
      <div className="row wrap">
        <div>
          <div className="kicker">사회공헌 레이어</div>
          <h2 id="impact-title">돌봄 공백을 줄이는 플랫폼이어야 합니다.</h2>
          <p>돈을 많이 내는 사람만 쓰는 앱이 아니라, 비용 부담이 있는 가정도 공공지원·후원·지역 서비스로 연결합니다.</p>
        </div>
        <StatusBadge label="공공지원 · 후원 쿠폰 · 무료 안부" tone="safe" />
      </div>
      <div className="impact-grid">
        {socialCarePrograms.map((program) => (
          <div className="impact-card" key={program.title}>
            <strong>{program.title}</strong>
            <p>{program.description}</p>
            <small>대상: {program.target}</small>
            <span className="badge warn">{program.appAction}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
