import Link from "next/link";
import { prepPackItems, documentRequests, nextVisitSuggestions } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function ConvenienceQuickSummary() {
  const missingPrep = prepPackItems.filter((item) => item.status === "missing").length;
  const requestedDocs = documentRequests.filter((item) => item.status === "requested" || item.status === "needed").length;

  return (
    <section className="convenience-panel stack">
      <div className="row wrap">
        <div>
          <h2>편의 체크 요약</h2>
          <p>오늘 병원 일정에서 사용자가 가장 자주 놓치는 부분만 먼저 보여줍니다.</p>
        </div>
        <Link className="ghost-button" href="/child/convenience">전체 보기</Link>
      </div>
      <div className="grid three compact-grid">
        <div className="mini-card"><StatusBadge label={missingPrep > 0 ? "확인 필요" : "완료"} tone={missingPrep > 0 ? "warn" : "safe"} /><strong>준비물</strong><span>누락 {missingPrep}개</span></div>
        <div className="mini-card"><StatusBadge label="진행 중" tone="safe" /><strong>서류 요청</strong><span>{requestedDocs}건 처리 중</span></div>
        <div className="mini-card"><StatusBadge label="후속" tone="neutral" /><strong>다음 예약</strong><span>{nextVisitSuggestions.length}개 후보</span></div>
      </div>
    </section>
  );
}
