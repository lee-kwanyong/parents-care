"use client";

import { useActionState } from "react";
import { completePrepItemAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { demoAppointment, prepPackItems } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

const categoryLabels: Record<string, string> = {
  document: "서류",
  medicine: "복약",
  mobility: "이동",
  payment: "비용",
  comfort: "편의",
  question: "질문",
  arrival: "동선"
};

const statusTone = {
  ready: "safe",
  missing: "warn",
  optional: "neutral",
  done: "safe"
} as const;

const statusLabel = {
  ready: "준비됨",
  missing: "필요",
  optional: "선택",
  done: "완료"
} as const;

export function PrepPackPanel() {
  const [state, formAction, pending] = useActionState(completePrepItemAction, idleActionState);

  return (
    <section className="convenience-panel stack">
      <div className="row wrap">
        <div>
          <h2>오늘 준비팩</h2>
          <p>신분증, 복용약, 질문, 결제수단처럼 매번 까먹기 쉬운 항목을 일정별로 자동 체크합니다.</p>
        </div>
        <StatusBadge label="D-day 체크" tone="safe" />
      </div>

      <div className="prep-grid">
        {prepPackItems.map((item) => (
          <form className="prep-card" action={formAction} key={item.id}>
            <input type="hidden" name="appointmentId" value={demoAppointment.id} />
            <input type="hidden" name="itemTitle" value={item.title} />
            <input type="hidden" name="category" value={item.category} />
            <div className="row wrap">
              <StatusBadge label={categoryLabels[item.category] ?? item.category} tone="neutral" />
              <StatusBadge label={statusLabel[item.status]} tone={statusTone[item.status]} />
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="meta-row">
              <span>담당 {item.owner}</span>
              <span>{item.due}</span>
              {item.required ? <span>필수</span> : <span>선택</span>}
            </div>
            <label className="field">
              <span>메모</span>
              <input name="note" placeholder="예: 가방 앞주머니에 넣음" />
            </label>
            <button className="button" type="submit" disabled={pending}>{pending ? "저장 중..." : "준비 완료"}</button>
          </form>
        ))}
      </div>
      <ActionStateNotice state={state} />
    </section>
  );
}
