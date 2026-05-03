"use client";

import { useActionState } from "react";
import { createMedicationReminderAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { demoAppointment, medicationReminders } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

export function MedicationReminderPanel() {
  const [state, formAction, pending] = useActionState(createMedicationReminderAction, idleActionState);

  return (
    <section className="convenience-panel stack">
      <div className="row wrap">
        <div>
          <h2>복약 확인 알림</h2>
          <p>진료 후 약 봉투가 리포트에 올라오면 가족이 저녁 복약 확인 전화를 놓치지 않게 합니다.</p>
        </div>
        <StatusBadge label="귀가 후 케어" tone="safe" />
      </div>

      <div className="grid two compact-grid">
        {medicationReminders.map((med) => (
          <div className="mini-card" key={med.id}>
            <div className="row wrap">
              <strong>{med.name}</strong>
              <StatusBadge label={med.status === "scheduled" ? "예약됨" : med.status} tone="safe" />
            </div>
            <span>{med.dose} · {med.timing}</span>
            <small>{med.owner} · {med.checkTime}</small>
          </div>
        ))}
      </div>

      <form className="form advanced-form" action={formAction}>
        <input type="hidden" name="appointmentId" value={demoAppointment.id} />
        <div className="form-grid two-col">
          <div className="field">
            <label htmlFor="medicineName">약 이름</label>
            <input id="medicineName" name="medicineName" defaultValue="소염진통제" required />
          </div>
          <div className="field">
            <label htmlFor="dose">용량</label>
            <input id="dose" name="dose" defaultValue="1정" required />
          </div>
          <div className="field">
            <label htmlFor="timing">복용 시점</label>
            <input id="timing" name="timing" defaultValue="저녁 식후 30분" required />
          </div>
          <div className="field">
            <label htmlFor="reminderAt">확인 시간</label>
            <input id="reminderAt" type="datetime-local" name="reminderAt" defaultValue="2026-05-20T20:00" required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ownerLabel">확인 담당자</label>
          <input id="ownerLabel" name="ownerLabel" defaultValue="딸" />
        </div>
        <button className="button" type="submit" disabled={pending}>{pending ? "저장 중..." : "복약 확인 알림 만들기"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
