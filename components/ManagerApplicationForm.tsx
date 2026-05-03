"use client";

import { useActionState, useState } from "react";
import { createManagerApplicationAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

export function ManagerApplicationForm() {
  const [state, formAction, isPending] = useActionState(createManagerApplicationAction, idleActionState);
  const [hasVehicle, setHasVehicle] = useState(false);

  return (
    <form className="form advanced-form" action={formAction}>
      <div className="row wrap">
        <div>
          <h3>매니저 지원서</h3>
          <p>운영실 심사/승인 전까지는 배정 후보로 노출되지 않습니다.</p>
        </div>
        <StatusBadge label="심사 대기" tone="warn" />
      </div>
      <div className="form-grid two-col">
        <div className="field"><label htmlFor="displayName">이름</label><input id="displayName" name="displayName" defaultValue="김안심" required /></div>
        <div className="field"><label htmlFor="phone">휴대폰</label><input id="phone" name="phone" defaultValue="010-0000-0000" required /></div>
        <label className="choice-card checkbox-card">
          <input type="checkbox" name="hasVehicle" checked={hasVehicle} onChange={(event) => setHasVehicle(event.target.checked)} />
          <span><strong>차량 보유</strong><small>신뢰정보로만 표시됩니다.</small></span>
        </label>
        <label className="choice-card checkbox-card disabled-choice">
          <input type="checkbox" name="directTransportAllowed" disabled />
          <span><strong>직접 운송 가능</strong><small>기본 서비스 미포함. 별도 제휴/계약/보험 검증 필요.</small></span>
        </label>
        <div className="field"><label htmlFor="regions">가능 지역</label><input id="regions" name="regions" defaultValue="강남구, 서초구, 송파구" required /></div>
        <div className="field"><label htmlFor="specialties">전문분야</label><input id="specialties" name="specialties" defaultValue="정형외과, 내과, 검진센터" required /></div>
      </div>
      <div className="field"><label htmlFor="careerSummary">경력/소개</label><textarea id="careerSummary" name="careerSummary" rows={5} defaultValue="병원동행 3년, 접수/수납/약국 동선 안내 경험. 보호자와의 리포트 커뮤니케이션 경험이 많습니다." required /></div>
      <div className="field"><label htmlFor="certificationSummary">자격/교육</label><textarea id="certificationSummary" name="certificationSummary" rows={3} defaultValue="요양보호 관련 교육 수료, 응급처치 교육 수료" /></div>
      <label className="policy-consent">
        <input type="checkbox" name="vehiclePolicyAcknowledged" required />
        <span>{hasVehicle ? "차량 있음은 신뢰정보로만 표시됩니다." : "차량이 없어도 병원 앞 만남·택시 동행·제휴 이동지원 배정이 가능합니다."} 직접 유상운송은 기본 서비스로 노출하지 않는다는 점을 확인했습니다.</span>
      </label>
      <button type="submit" className="button primary-action" disabled={isPending}>{isPending ? "제출 중..." : "지원서 제출"}</button>
      <ActionStateNotice state={state} />
    </form>
  );
}
