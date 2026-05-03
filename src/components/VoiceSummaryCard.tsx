import { demoReport } from "@/lib/demo-data";

export function VoiceSummaryCard() {
  return (
    <section className="panel stack voice-summary-card">
      <div className="kicker">30초 요약 리포트</div>
      <h2>긴 리포트 전에 핵심만 먼저 알려줍니다.</h2>
      <div className="share-template">
        <pre>{`오늘 진료는 잘 끝났습니다.\n${demoReport.medications[0]}이 처방됐고, ${demoReport.nextAppointment}이 필요합니다.\n가족이 할 일은 ${demoReport.guardianNextActions.slice(0, 2).join(" 그리고 ")}입니다.`}</pre>
      </div>
      <button className="button" type="button">음성 요약 재생 예시</button>
    </section>
  );
}
