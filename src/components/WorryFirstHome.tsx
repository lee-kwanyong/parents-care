import Link from "next/link";
import { carePromiseCopy } from "@/lib/constants";
import { todayAssurance } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function WorryFirstHome() {
  return (
    <section className="hero worry-hero">
      <div className="hero-card stack">
        <div className="kicker">부모님 케어 플랫폼 · 40대 이상 보호자 맞춤</div>
        <h1>부모님 걱정, 기능 찾지 말고 그냥 맡기세요.</h1>
        <p>{carePromiseCopy}</p>
        <div className="row wrap" style={{ justifyContent: "flex-start" }}>
          <StatusBadge label="3터치 이내" tone="safe" />
          <StatusBadge label="전화·카톡·사진 접수" tone="safe" />
          <StatusBadge label="잘 모르겠어요 가능" tone="warn" />
          <StatusBadge label="사회공헌 케어" tone="safe" />
        </div>
        <div className="row wrap" style={{ justifyContent: "flex-start" }}>
          <Link href="/child/worry" className="button primary-action">걱정 맡기기</Link>
          <Link href="/care-meal" className="ghost-button">밥·약 확인</Link>
          <Link href="/care-plans/discharge" className="ghost-button">퇴원 후 케어</Link>
          <Link href="/care-comfort" className="ghost-button">편리함 설정</Link>
        </div>
      </div>
      <div className="panel stack assurance-card">
        <span className="badge">오늘의 안심판</span>
        <h2>{todayAssurance.title}</h2>
        <p>{todayAssurance.summary}</p>
        <div className="candidate-score safety-score"><strong>{todayAssurance.score}</strong><span>안심 점수</span></div>
        <div className="stack">
          {todayAssurance.signals.map((signal) => <div className="mini-card" key={signal}><strong>✓ {signal}</strong></div>)}
        </div>
      </div>
    </section>
  );
}
