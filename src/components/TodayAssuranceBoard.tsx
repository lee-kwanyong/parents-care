import Link from "next/link";
import { todayAssurance } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function TodayAssuranceBoard() {
  const tone = todayAssurance.state === "safe" ? "safe" : todayAssurance.state === "urgent" ? "danger" : "warn";
  return (
    <section className="panel stack assurance-card">
      <div className="row wrap">
        <div>
          <div className="kicker">오늘 엄마 상태</div>
          <h2>{todayAssurance.title}</h2>
          <p>{todayAssurance.summary}</p>
        </div>
        <StatusBadge label={todayAssurance.state === "safe" ? "안심" : todayAssurance.state === "urgent" ? "긴급" : "확인 필요"} tone={tone} />
      </div>
      <div className="grid two compact-grid">
        <div className="candidate-score safety-score"><strong>{todayAssurance.score}</strong><span>안심 점수</span></div>
        <div className="stack">
          {todayAssurance.needsCheck.map((item) => <div className="policy-box" key={item}><strong>확인 필요</strong><p>{item}</p></div>)}
        </div>
      </div>
      <div className="grid two compact-grid">
        {todayAssurance.signals.map((signal) => <div className="mini-card" key={signal}><strong>✓ {signal}</strong></div>)}
      </div>
      <div className="row wrap" style={{ justifyContent: "flex-start" }}>
        <Link href="/child/worry" className="button">걱정 맡기기</Link>
        <Link href="/child/appointments/demo" className="ghost-button">자세한 타임라인</Link>
      </div>
    </section>
  );
}
