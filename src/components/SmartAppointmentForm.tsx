"use client";

import { useActionState } from "react";
import { createAppointmentAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { guardianQuestionTemplates, transportModes, vehiclePolicyCopy } from "@/lib/constants";
import { ActionStateNotice } from "./ActionStateNotice";
import { ConsentMatrix } from "./ConsentMatrix";

export function SmartAppointmentForm() {
  const [state, formAction, isPending] = useActionState(createAppointmentAction, idleActionState);

  return (
    <form className="form advanced-form" action={formAction}>
      <div className="form-grid two-col">
        <div className="field">
          <label htmlFor="elderName">부모님 성함</label>
          <input id="elderName" name="elderName" defaultValue="이정순" required />
        </div>
        <div className="field">
          <label htmlFor="hospitalName">병원명</label>
          <input id="hospitalName" name="hospitalName" defaultValue="서울튼튼병원" required />
        </div>
        <div className="field">
          <label htmlFor="department">진료과/목적</label>
          <input id="department" name="department" defaultValue="정형외과 재진" required />
        </div>
        <div className="field">
          <label htmlFor="appointmentDate">진료일</label>
          <input id="appointmentDate" name="appointmentDate" type="date" defaultValue="2026-05-20" required />
        </div>
        <div className="field">
          <label htmlFor="appointmentTime">진료 시간</label>
          <input id="appointmentTime" name="appointmentTime" type="time" defaultValue="10:30" required />
        </div>
        <div className="field">
          <label htmlFor="meetPlace">만남 장소</label>
          <input id="meetPlace" name="meetPlace" defaultValue="자택 1층 공동현관 앞" required />
        </div>
      </div>

      <fieldset className="fieldset stack">
        <legend>이동 방식</legend>
        <p>{vehiclePolicyCopy}</p>
        <div className="choice-grid">
          {transportModes.map((mode) => (
            <label className="choice-card" key={mode.code}>
              <input type="radio" name="pickupMethod" value={mode.code} defaultChecked={mode.code === "home_front_meet_taxi"} />
              <span>
                <strong>{mode.label}</strong>
                <small>{mode.short}</small>
              </span>
            </label>
          ))}
        </div>
        <label className="policy-consent">
          <input type="checkbox" name="vehiclePolicyAcknowledged" required />
          <span>차량 보유 여부와 직접 운송 가능 여부가 다르며, 기본 서비스는 매니저 개인차량 유상운송이 아니라는 점을 확인했습니다.</span>
        </label>
      </fieldset>

      <div className="field">
        <label htmlFor="mobilityNote">부모님 케어 메모</label>
        <textarea id="mobilityNote" name="mobilityNote" rows={4} defaultValue="무릎 통증이 있어 계단보다 엘리베이터 동선을 선호. 대기 시간이 길면 잠깐 앉아서 쉬어야 함." />
      </div>

      <div className="field">
        <label htmlFor="guardianQuestions">의료진에게 확인할 질문</label>
        <textarea id="guardianQuestions" name="guardianQuestions" rows={5} defaultValue={guardianQuestionTemplates.slice(0, 4).join("\n")} />
      </div>

      <fieldset className="fieldset stack">
        <legend>자녀에게 공유할 범위</legend>
        <ConsentMatrix />
      </fieldset>

      <button className="button primary-action" type="submit" disabled={isPending}>{isPending ? "저장 중..." : "Supabase에 일정 저장"}</button>
      <ActionStateNotice state={state} />
    </form>
  );
}
