"use client";

import { useActionState } from "react";
import { requestDocumentAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { demoAppointment, documentRequests } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

const statusTone = {
  needed: "warn",
  requested: "safe",
  received: "safe",
  not_needed: "neutral"
} as const;

const statusLabel = {
  needed: "요청 필요",
  requested: "요청됨",
  received: "수령",
  not_needed: "불필요"
} as const;

export function DocumentRequestPanel() {
  const [state, formAction, pending] = useActionState(requestDocumentAction, idleActionState);

  return (
    <section className="convenience-panel stack">
      <div className="row wrap">
        <div>
          <h2>서류·영수증 요청함</h2>
          <p>진료비 영수증, 세부내역서, 처방전처럼 나중에 찾기 어려운 자료를 현장에서 바로 요청합니다.</p>
        </div>
        <StatusBadge label="보험청구 준비" tone="safe" />
      </div>

      <div className="table-like convenience-table">
        {documentRequests.map((doc) => (
          <div className="table-row four-col" key={doc.id}>
            <strong>{doc.title}</strong>
            <span>{doc.reason}</span>
            <span>{doc.feeHint}</span>
            <StatusBadge label={statusLabel[doc.status]} tone={statusTone[doc.status]} />
          </div>
        ))}
      </div>

      <form className="form advanced-form" action={formAction}>
        <input type="hidden" name="appointmentId" value={demoAppointment.id} />
        <div className="form-grid two-col">
          <div className="field">
            <label htmlFor="doc-title">추가 요청 서류</label>
            <select id="doc-title" name="title" defaultValue="통원확인서">
              <option>통원확인서</option>
              <option>진료비 세부내역서</option>
              <option>진단서</option>
              <option>처방전 사본</option>
              <option>검사 결과지</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="doc-scope">공유 동의 범위</label>
            <select id="doc-scope" name="requiredConsentScope" defaultValue="payment_receipt">
              <option value="payment_receipt">비용·영수증</option>
              <option value="medical_detail">검사·약 상세</option>
              <option value="report_summary">리포트 요약</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="doc-reason">필요한 이유</label>
          <input id="doc-reason" name="reason" defaultValue="보험 청구 가능성 확인을 위해 필요합니다." required />
        </div>
        <label className="checkbox-line"><input name="shareWithFamily" type="checkbox" defaultChecked /> 가족 공동조회에 표시</label>
        <button className="button" type="submit" disabled={pending}>{pending ? "요청 중..." : "현장 서류 요청 추가"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
