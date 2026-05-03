"use client";

import { useActionState } from "react";
import { createPostDischargePackAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { dischargeCareDays } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";

export function DischargeCarePackPanel() {
  const [state, formAction, isPending] = useActionState(createPostDischargePackAction, idleActionState);

  return (
    <section className="panel stack discharge-panel">
      <div>
        <div className="kicker">퇴원 후 7일 안심팩</div>
        <h2>퇴원 후가 가족 불안이 가장 큰 시점입니다.</h2>
        <p>귀가, 약 정리, 식사, 통증, 낙상, 다음 외래, 가족 할 일을 7일간 확인합니다.</p>
      </div>

      <div className="grid four compact-grid">
        {dischargeCareDays.map((day) => (
          <div className="mini-card" key={day.day}>
            <strong>{day.day}일차 · {day.title}</strong>
            <span>{day.familyOutput}</span>
            <ul className="feature-list">
              {day.checks.map((check) => <li key={check}>{check}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <form className="form advanced-form" action={formAction}>
        <div className="form-grid two-col">
          <div className="field"><label htmlFor="elderName">부모님 성함</label><input id="elderName" name="elderName" defaultValue="이정순" required /></div>
          <div className="field"><label htmlFor="dischargeDate">퇴원일</label><input id="dischargeDate" name="dischargeDate" type="date" defaultValue="2026-05-06" required /></div>
          <div className="field"><label htmlFor="hospitalName">퇴원 병원</label><input id="hospitalName" name="hospitalName" defaultValue="서울튼튼병원" /></div>
          <div className="field"><label htmlFor="surgeryOrReason">입원/수술 이유</label><input id="surgeryOrReason" name="surgeryOrReason" defaultValue="무릎 통증 입원 치료 후 퇴원" /></div>
        </div>
        <div className="field"><label htmlFor="mainConcern">가장 걱정되는 부분</label><textarea id="mainConcern" name="mainConcern" rows={4} defaultValue="집에 오신 뒤 식사와 약 복용, 욕실 낙상이 걱정됩니다." required /></div>
        <div className="choice-grid">
          <label className="choice-card"><input type="checkbox" name="needsMeal" defaultChecked /><span><strong>식사 확인 필요</strong><small>안심밥상 연결</small></span></label>
          <label className="choice-card"><input type="checkbox" name="needsMedicationSorting" defaultChecked /><span><strong>약 정리 필요</strong><small>처방약/복용시간 정리</small></span></label>
          <label className="choice-card"><input type="checkbox" name="needsFallRiskCheck" defaultChecked /><span><strong>낙상 위험 확인</strong><small>욕실/문턱/야간동선</small></span></label>
          <label className="choice-card"><input type="checkbox" name="needsOpsCall" defaultChecked /><span><strong>전화 상담</strong><small>운영실이 정리</small></span></label>
        </div>
        <div className="field"><label htmlFor="familyContact">연락받을 번호</label><input id="familyContact" name="familyContact" placeholder="010-0000-0000" /></div>
        <button type="submit" className="button primary-action" disabled={isPending}>{isPending ? "접수 중..." : "퇴원 후 7일팩 접수"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
