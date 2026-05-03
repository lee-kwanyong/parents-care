"use client";

import { useActionState } from "react";
import { updateCarePassportAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { demoCarePassport } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

export function CarePassportDeepPanel() {
  const [state, formAction, isPending] = useActionState(updateCarePassportAction, idleActionState);

  return (
    <section className="panel stack">
      <div className="row wrap">
        <div>
          <div className="kicker">부모님 케어패스포트</div>
          <h2>부모님을 알수록 서비스 품질이 좋아집니다.</h2>
          <p>대리운전은 고객을 몰라도 되지만, 돌봄은 부모님 상태와 선호를 알고 들어가야 합니다.</p>
        </div>
        <StatusBadge label="반복 이용 품질 자산" tone="safe" />
      </div>

      <div className="grid three compact-grid">
        <div className="mini-card"><strong>거동</strong><span>{demoCarePassport.mobility}</span></div>
        <div className="mini-card"><strong>청력/소통</strong><span>{demoCarePassport.hearing}</span></div>
        <div className="mini-card"><strong>식사</strong><span>{demoCarePassport.mealNeeds.join(" · ")}</span></div>
        <div className="mini-card"><strong>복용약</strong><span>{demoCarePassport.medications.join(" · ")}</span></div>
        <div className="mini-card"><strong>낙상 주의</strong><span>{demoCarePassport.fallRisk}</span></div>
        <div className="mini-card"><strong>선호 매니저</strong><span>{demoCarePassport.preferredManagerNote}</span></div>
      </div>

      <form className="form advanced-form" action={formAction}>
        <div className="form-grid two-col">
          <div className="field"><label htmlFor="elderName">부모님 성함</label><input id="elderName" name="elderName" defaultValue={demoCarePassport.elderName} required /></div>
          <div className="field"><label htmlFor="nickname">부르는 이름</label><input id="nickname" name="nickname" defaultValue={demoCarePassport.nickname} /></div>
          <div className="field"><label htmlFor="mobility">거동/보행</label><input id="mobility" name="mobility" defaultValue={demoCarePassport.mobility} required /></div>
          <div className="field"><label htmlFor="preferredHospitalTime">선호 병원 시간</label><input id="preferredHospitalTime" name="preferredHospitalTime" defaultValue={demoCarePassport.preferredHospitalTime} /></div>
          <div className="field"><label htmlFor="hearing">청력</label><input id="hearing" name="hearing" defaultValue={demoCarePassport.hearing} /></div>
          <div className="field"><label htmlFor="vision">시력/글씨</label><input id="vision" name="vision" defaultValue={demoCarePassport.vision} /></div>
        </div>
        <div className="field"><label htmlFor="communication">편한 설명 방식</label><textarea id="communication" name="communication" rows={3} defaultValue={demoCarePassport.communication} /></div>
        <fieldset className="fieldset stack">
          <legend>식사 주의</legend>
          <div className="choice-grid">
            {["딱딱한 음식 어려움", "저염식", "당뇨식", "죽/연화식", "식사 확인 필요", "잘 모르겠음"].map((need) => (
              <label className="choice-card" key={need}><input type="checkbox" name="mealNeeds" value={need} defaultChecked={demoCarePassport.mealNeeds.includes(need)} /><span><strong>{need}</strong></span></label>
            ))}
          </div>
        </fieldset>
        <div className="field"><label htmlFor="medications">복용약/주의</label><textarea id="medications" name="medications" rows={3} defaultValue={demoCarePassport.medications.join("\n")} /></div>
        <div className="form-grid two-col">
          <div className="field"><label htmlFor="allergy">알레르기</label><input id="allergy" name="allergy" defaultValue={demoCarePassport.allergy} /></div>
          <div className="field"><label htmlFor="fallRisk">낙상 위험</label><input id="fallRisk" name="fallRisk" defaultValue={demoCarePassport.fallRisk} /></div>
          <div className="field"><label htmlFor="preferredManagerNote">매니저 선호</label><input id="preferredManagerNote" name="preferredManagerNote" defaultValue={demoCarePassport.preferredManagerNote} /></div>
          <div className="field"><label htmlFor="emergencyContacts">긴급 연락처</label><input id="emergencyContacts" name="emergencyContacts" defaultValue={demoCarePassport.emergencyContacts.join(" / ")} /></div>
        </div>
        <div className="field"><label htmlFor="shareScope">공유 범위</label><input id="shareScope" name="shareScope" defaultValue={demoCarePassport.shareScope} /></div>
        <button type="submit" className="button primary-action" disabled={isPending}>{isPending ? "저장 중..." : "케어패스포트 저장"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
