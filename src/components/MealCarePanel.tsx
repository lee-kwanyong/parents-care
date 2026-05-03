"use client";

import { useActionState } from "react";
import { recordMealCheckAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { mealCareOptions } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

export function MealCarePanel() {
  const [state, formAction, isPending] = useActionState(recordMealCheckAction, idleActionState);

  return (
    <section className="meal-care-panel stack" aria-labelledby="meal-care-title">
      <div className="row wrap">
        <div>
          <div className="kicker">안심밥상</div>
          <h2 id="meal-care-title">병원보다 더 자주 생기는 걱정은 식사입니다.</h2>
          <p>음식을 못 해드시는 부모님, 씹기 어려운 부모님, 퇴원 후 회복식이 필요한 부모님까지 식사 확인과 배송 연결을 묶습니다.</p>
        </div>
        <StatusBadge label="식사 확인 · 정기배송 · 회복식" tone="warn" />
      </div>

      <div className="meal-option-grid">
        {mealCareOptions.map((option) => (
          <div className="meal-option-card" key={option.title}>
            <strong>{option.title}</strong>
            <p>{option.description}</p>
            <small>{option.suitableFor}</small>
            <span className="badge">{option.actionLabel}</span>
          </div>
        ))}
      </div>

      <form className="form" action={formAction}>
        <div className="form-grid two-col">
          <div className="field">
            <label htmlFor="meal-elderName">부모님 성함</label>
            <input id="meal-elderName" name="elderName" defaultValue="이정순 어머니" required />
          </div>
          <div className="field">
            <label htmlFor="mealTime">확인할 식사</label>
            <select id="mealTime" name="mealTime" defaultValue="lunch">
              <option value="breakfast">아침</option>
              <option value="lunch">점심</option>
              <option value="dinner">저녁</option>
              <option value="snack">간식/죽</option>
            </select>
          </div>
        </div>
        <fieldset className="fieldset stack">
          <legend>식사 상태</legend>
          <div className="simple-radio-grid">
            <label className="large-radio"><input type="radio" name="eatenStatus" value="ate" defaultChecked /><span>드셨어요</span></label>
            <label className="large-radio"><input type="radio" name="eatenStatus" value="not_yet" /><span>아직 안 드셨어요</span></label>
            <label className="large-radio"><input type="radio" name="eatenStatus" value="skipped" /><span>못 드셨어요</span></label>
            <label className="large-radio"><input type="radio" name="eatenStatus" value="unknown" /><span>확인이 필요해요</span></label>
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="meal-note">메모</label>
          <textarea id="meal-note" name="note" rows={3} defaultValue="딱딱한 반찬은 어렵고 죽이나 부드러운 반찬이면 좋겠습니다." />
        </div>
        <label className="policy-consent">
          <input type="checkbox" name="deliveryInterest" />
          <span>식사 정기배송, 저염식, 회복식 상담도 함께 받아보고 싶습니다.</span>
        </label>
        <button className="button primary-action" type="submit" disabled={isPending}>{isPending ? "기록 중..." : "식사 확인 저장"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
