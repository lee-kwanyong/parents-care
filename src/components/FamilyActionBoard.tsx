"use client";

import { useActionState } from "react";
import { createQuickFamilyTaskAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { demoAppointment, familyConvenienceActions, familyShareTemplate } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

const statusLabel = {
  todo: "할 일",
  in_progress: "진행",
  done: "완료",
  skipped: "생략"
} as const;

const priorityTone = {
  low: "neutral",
  medium: "warn",
  high: "danger"
} as const;

export function FamilyActionBoard() {
  const [state, formAction, pending] = useActionState(createQuickFamilyTaskAction, idleActionState);

  return (
    <section className="convenience-panel stack">
      <div className="row wrap">
        <div>
          <h2>가족 할 일 보드</h2>
          <p>전화·카톡으로 흩어지는 일을 담당자와 마감 기준으로 정리합니다.</p>
        </div>
        <StatusBadge label="가족 공동관리" tone="safe" />
      </div>

      <div className="family-board">
        {familyConvenienceActions.map((item) => (
          <div className="family-task-card" key={item.id}>
            <div className="row wrap">
              <StatusBadge label={statusLabel[item.status]} tone={item.status === "done" ? "safe" : "neutral"} />
              <StatusBadge label={item.priority === "high" ? "중요" : item.priority === "medium" ? "보통" : "낮음"} tone={priorityTone[item.priority]} />
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="meta-row"><span>{item.owner}</span><span>{item.due}</span><span>{item.source}</span></div>
          </div>
        ))}
      </div>

      <form className="form advanced-form" action={formAction}>
        <input type="hidden" name="appointmentId" value={demoAppointment.id} />
        <div className="form-grid two-col">
          <div className="field">
            <label htmlFor="task-title">빠른 할 일 추가</label>
            <input id="task-title" name="title" defaultValue="물리치료 예약 가능 시간 확인" required />
          </div>
          <div className="field">
            <label htmlFor="task-owner">담당자</label>
            <input id="task-owner" name="ownerLabel" defaultValue="둘째" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="task-description">설명</label>
          <input id="task-description" name="description" defaultValue="리포트 수신 후 병원에 가능한 시간대를 확인합니다." />
        </div>
        <div className="field">
          <label htmlFor="task-due">마감</label>
          <input id="task-due" name="dueAt" type="datetime-local" defaultValue="2026-05-21T10:00" />
        </div>
        <button className="button" type="submit" disabled={pending}>{pending ? "추가 중..." : "가족 할 일 추가"}</button>
        <ActionStateNotice state={state} />
      </form>

      <div className="share-template">
        <div className="row wrap">
          <h3>가족 공유 문구</h3>
          <StatusBadge label="복사해서 카톡" tone="neutral" />
        </div>
        <pre>{familyShareTemplate}</pre>
      </div>
    </section>
  );
}
