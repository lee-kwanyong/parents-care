"use client";

import { useActionState } from "react";
import { createNextVisitDraftAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { demoAppointment, nextVisitSuggestions } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

const statusLabel = {
  suggested: "제안",
  drafted: "초안",
  confirmed: "확정",
  dismissed: "제외"
} as const;

export function NextVisitPlanner() {
  const [state, formAction, pending] = useActionState(createNextVisitDraftAction, idleActionState);

  return (
    <section className="convenience-panel stack">
      <div className="row wrap">
        <div>
          <h2>다음 예약 후보</h2>
          <p>리포트 속 다음 예약 안내를 가족 할 일과 새 일정 초안으로 연결합니다.</p>
        </div>
        <StatusBadge label="정기진료 연결" tone="safe" />
      </div>

      <div className="grid two compact-grid">
        {nextVisitSuggestions.map((item) => (
          <div className="mini-card" key={item.id}>
            <div className="row wrap">
              <strong>{item.title}</strong>
              <StatusBadge label={statusLabel[item.status]} tone={item.status === "suggested" ? "warn" : "safe"} />
            </div>
            <span>{item.suggestedAt}</span>
            <small>{item.reason} · 담당 {item.owner}</small>
          </div>
        ))}
      </div>

      <form className="form advanced-form" action={formAction}>
        <input type="hidden" name="appointmentId" value={demoAppointment.id} />
        <div className="form-grid two-col">
          <div className="field">
            <label htmlFor="next-title">일정명</label>
            <input id="next-title" name="title" defaultValue="정형외과 재진" required />
          </div>
          <div className="field">
            <label htmlFor="next-owner">담당자</label>
            <input id="next-owner" name="ownerLabel" defaultValue="가족 공동" />
          </div>
          <div className="field">
            <label htmlFor="next-date">날짜</label>
            <input id="next-date" name="suggestedDate" type="date" defaultValue="2026-06-17" required />
          </div>
          <div className="field">
            <label htmlFor="next-time">시간</label>
            <input id="next-time" name="suggestedTime" type="time" defaultValue="10:20" required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="next-reason">근거</label>
          <input id="next-reason" name="reason" defaultValue="의료진이 4주 후 경과 확인을 안내했습니다." required />
        </div>
        <button className="button" type="submit" disabled={pending}>{pending ? "생성 중..." : "다음 일정 초안 만들기"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
