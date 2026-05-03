"use client";

import { useActionState } from "react";
import { createRecurringCareAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { recurringCareItems } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

export function RecurringCarePanel() {
  const [state, formAction, isPending] = useActionState(createRecurringCareAction, idleActionState);

  return (
    <section className="panel stack recurring-panel">
      <div className="row wrap">
        <div>
          <div className="kicker">정기진료·정기케어 자동관리</div>
          <h2>부모님 케어는 한 번으로 끝나지 않습니다.</h2>
          <p>다음 진료, 약 확인, 식사 안부, 가족 할 일을 반복 일정으로 관리합니다.</p>
        </div>
        <StatusBadge label="계속 필요한 플랫폼" tone="safe" />
      </div>

      <div className="table-like">
        {recurringCareItems.map((item) => (
          <div className="table-row four-col" key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.cadence}</span>
            <span>{item.nextDue}</span>
            <span>{item.autoSuggestion}</span>
          </div>
        ))}
      </div>

      <form className="form advanced-form" action={formAction}>
        <div className="form-grid two-col">
          <div className="field"><label htmlFor="elderName">부모님 성함</label><input id="elderName" name="elderName" defaultValue="이정순" required /></div>
          <div className="field"><label htmlFor="cadence">반복 주기</label><input id="cadence" name="cadence" defaultValue="4주마다" required /></div>
          <div className="field"><label htmlFor="nextDue">다음 시점</label><input id="nextDue" name="nextDue" type="date" defaultValue="2026-06-17" /></div>
          <div className="field"><label htmlFor="familyOwner">가족 담당자</label><input id="familyOwner" name="familyOwner" defaultValue="큰아들" /></div>
        </div>
        <fieldset className="fieldset stack">
          <legend>케어 종류</legend>
          <div className="choice-grid">
            <label className="choice-card"><input type="radio" name="careType" value="regular_visit" defaultChecked /><span><strong>정기진료</strong><small>다음 예약 자동 확인</small></span></label>
            <label className="choice-card"><input type="radio" name="careType" value="medication" /><span><strong>복약 확인</strong><small>먹었어요/미확인</small></span></label>
            <label className="choice-card"><input type="radio" name="careType" value="meal_check" /><span><strong>식사 확인</strong><small>안심밥상 연결</small></span></label>
            <label className="choice-card"><input type="radio" name="careType" value="not_sure" /><span><strong>잘 모르겠어요</strong><small>운영실 추천</small></span></label>
          </div>
        </fieldset>
        <div className="field"><label htmlFor="note">메모</label><textarea id="note" name="note" rows={3} defaultValue="정형외과 재진과 저녁 약 확인을 반복 관리하고 싶습니다." /></div>
        <button type="submit" className="button primary-action" disabled={isPending}>{isPending ? "등록 중..." : "정기 케어 등록"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
