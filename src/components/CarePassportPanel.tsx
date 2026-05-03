"use client";

import { useActionState } from "react";
import { saveCarePassportAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { carePassportHighlights } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

export function CarePassportPanel() {
  const [state, formAction, isPending] = useActionState(saveCarePassportAction, idleActionState);

  return (
    <section className="passport-panel stack" aria-labelledby="passport-title">
      <div className="row wrap">
        <div>
          <div className="kicker">부모님 케어패스포트</div>
          <h2 id="passport-title">부모님을 알수록 케어 품질이 좋아집니다.</h2>
          <p>대리운전은 고객을 몰라도 되지만, 돌봄은 부모님의 거동·식사·약·말투·주의사항을 알고 들어가야 합니다.</p>
        </div>
        <StatusBadge label="매니저에게 필요한 만큼만 공유" tone="safe" />
      </div>

      <div className="passport-grid">
        {carePassportHighlights.map((item) => (
          <div className="passport-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.helper}</p>
            <small>공유: {item.visibility === "family" ? "가족" : item.visibility === "manager" ? "매니저" : "운영실"}</small>
          </div>
        ))}
      </div>

      <form className="form passport-form" action={formAction}>
        <div className="form-grid two-col">
          <div className="field">
            <label htmlFor="passport-elderName">부모님 성함</label>
            <input id="passport-elderName" name="elderName" defaultValue="이정순 어머니" required />
          </div>
          <div className="field">
            <label htmlFor="emergencyContact">긴급 연락처</label>
            <input id="emergencyContact" name="emergencyContact" placeholder="첫째 아들 010-0000-0000" />
          </div>
        </div>
        <div className="form-grid two-col">
          <div className="field">
            <label htmlFor="mobilityNote">거동/이동</label>
            <textarea id="mobilityNote" name="mobilityNote" rows={3} defaultValue="천천히 걸으시고 계단보다 엘리베이터가 필요합니다." />
          </div>
          <div className="field">
            <label htmlFor="hearingNote">청력/설명 방식</label>
            <textarea id="hearingNote" name="hearingNote" rows={3} defaultValue="오른쪽 귀가 잘 안 들려 왼쪽에서 천천히 설명해 주세요." />
          </div>
          <div className="field">
            <label htmlFor="mealNote">식사</label>
            <textarea id="mealNote" name="mealNote" rows={3} defaultValue="딱딱한 음식은 어렵고 부드러운 반찬과 죽을 선호합니다." />
          </div>
          <div className="field">
            <label htmlFor="medicationNote">약/주의사항</label>
            <textarea id="medicationNote" name="medicationNote" rows={3} defaultValue="혈압약 복용 중입니다. 새 처방약과 복용 시간을 확인해야 합니다." />
          </div>
        </div>
        <div className="field">
          <label htmlFor="preferredTone">부모님께 편한 표현</label>
          <input id="preferredTone" name="preferredTone" defaultValue="관리받는다는 표현보다 도와드린다는 표현을 좋아하십니다." />
        </div>
        <label className="checkbox-line">
          <input type="checkbox" name="fallRisk" defaultChecked />
          <span>낙상 위험이 있어 화장실·계단·택시 승하차 시 주의가 필요합니다.</span>
        </label>
        <button className="button primary-action" type="submit" disabled={isPending}>{isPending ? "저장 중..." : "케어패스포트 저장"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
