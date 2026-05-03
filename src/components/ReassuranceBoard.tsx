import { reassuranceSignals } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function ReassuranceBoard() {
  const main = reassuranceSignals[0];

  return (
    <section className="reassurance-board panel stack" aria-labelledby="reassurance-title">
      <div className="row wrap" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="kicker">오늘의 안심판</div>
          <h2 id="reassurance-title">오늘 어머니 상태는 {main.value}입니다.</h2>
          <p>자녀가 처음 봐야 할 것은 긴 리포트가 아니라, 괜찮은지와 지금 해야 할 일입니다.</p>
        </div>
        <StatusBadge label="안심 / 확인 필요 / 긴급" tone="safe" />
      </div>

      <div className="reassurance-grid">
        {reassuranceSignals.map((signal) => (
          <div className={`reassurance-card ${signal.tone}`} key={signal.label}>
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
            <small>{signal.helper}</small>
          </div>
        ))}
      </div>

      <div className="simple-actions">
        <a className="button primary-action" href="/care-request">부모님 걱정 맡기기</a>
        <a className="ghost-button primary-action" href="/care-passport">케어패스포트 확인</a>
      </div>
    </section>
  );
}
