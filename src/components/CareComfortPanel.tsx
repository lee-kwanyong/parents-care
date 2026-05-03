"use client";

import { useActionState } from "react";
import { saveComfortPreferenceAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { comfortFeatures } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

export function CareComfortPanel() {
  const [state, formAction, isPending] = useActionState(saveComfortPreferenceAction, idleActionState);

  return (
    <section className="panel stack comfort-panel">
      <div className="row wrap">
        <div>
          <div className="kicker">편리함 차별화 패키지</div>
          <h2>사용자가 귀찮아할 일을 앱이 먼저 줄입니다.</h2>
          <p>사전 안심전화, 30초 요약, 비용 사전승인, 같은 매니저 우선, 가족 역할 배분, 부담 없는 문구까지 포함합니다.</p>
        </div>
        <StatusBadge label="편리함이 차별화" tone="safe" />
      </div>

      <div className="grid three compact-grid">
        {comfortFeatures.map((feature) => (
          <div className="mini-card" key={feature.title}>
            <strong>{feature.title}</strong>
            <span>{feature.description}</span>
            <small>{feature.userBenefit} · {feature.includedIn}</small>
          </div>
        ))}
      </div>

      <form className="form advanced-form" action={formAction}>
        <div className="field"><label htmlFor="elderName">부모님 성함</label><input id="elderName" name="elderName" defaultValue="이정순" required /></div>
        <div className="choice-grid">
          <label className="choice-card"><input type="checkbox" name="preCallNeeded" defaultChecked /><span><strong>사전 안심전화</strong><small>처음 만나는 부담을 줄입니다.</small></span></label>
          <label className="choice-card"><input type="checkbox" name="audioSummaryNeeded" defaultChecked /><span><strong>30초 요약 리포트</strong><small>긴 리포트 전 핵심만 확인합니다.</small></span></label>
          <label className="choice-card"><input type="checkbox" name="sameManagerPreferred" defaultChecked /><span><strong>같은 매니저 우선</strong><small>낯선 사람 부담을 줄입니다.</small></span></label>
          <label className="choice-card"><input type="checkbox" name="costApprovalRequired" defaultChecked /><span><strong>추가비용 사전승인</strong><small>동행비 외 실비는 먼저 확인받습니다.</small></span></label>
        </div>
        <div className="form-grid two-col">
          <div className="field"><label htmlFor="parentWordingPreference">부모님께 쓰면 편한 표현</label><input id="parentWordingPreference" name="parentWordingPreference" defaultValue="도와드릴 분, 안심 소식, 오늘 일정" /></div>
          <div className="field"><label htmlFor="familyRoleNote">가족 역할 배분 메모</label><input id="familyRoleNote" name="familyRoleNote" defaultValue="큰아들: 예약, 딸: 약 확인, 배우자: 보험서류" /></div>
        </div>
        <button type="submit" className="button primary-action" disabled={isPending}>{isPending ? "저장 중..." : "편리함 설정 저장"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
