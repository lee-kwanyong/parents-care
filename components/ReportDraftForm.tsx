"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

export function ReportDraftForm() {
  const [saved, setSaved] = useState(false);

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    window.localStorage.setItem("ansim-demo-report-draft", JSON.stringify({ ...Object.fromEntries(formData.entries()), savedAt: new Date().toISOString() }));
    setSaved(true);
  }

  return (
    <form className="card form" onSubmit={save}>
      <div className="row">
        <h3>보호자 리포트 초안</h3>
        <StatusBadge label={saved ? "초안 저장" : "작성 중"} tone={saved ? "safe" : "neutral"} />
      </div>
      <div className="field"><label htmlFor="summary">진료 진행 내용</label><textarea id="summary" name="summary" rows={4} placeholder="접수, 대기, 진료실 동행, 수납 등 진행 내용을 적습니다." /></div>
      <div className="field"><label htmlFor="doctor">의료진 안내사항</label><textarea id="doctor" name="doctor" rows={4} placeholder="의료진이 말한 안내사항과 매니저 의견을 분리해서 적습니다." /></div>
      <div className="field"><label htmlFor="medicine">검사/약/다음 예약</label><textarea id="medicine" name="medicine" rows={4} placeholder="검사 결과 설명, 처방약, 약국 안내, 다음 예약 필요 여부를 정리합니다." /></div>
      <div className="field"><label htmlFor="cost">비용</label><textarea id="cost" name="cost" rows={2} placeholder="진료비, 약제비, 택시비 실비 등" /></div>
      <div className="field"><label htmlFor="condition">부모님 컨디션</label><textarea id="condition" name="condition" rows={4} placeholder="피로도, 통증, 식사 여부, 보행 상태, 기분" /></div>
      <div className="field"><label htmlFor="actions">보호자가 해야 할 다음 액션</label><textarea id="actions" name="actions" rows={4} placeholder="약 복용 확인, 다음 예약, 검사 결과 확인, 보험서류 요청 등" /></div>
      <button type="submit" className="button">운영실 검수 요청</button>
      {saved ? <p className="success-message">초안이 저장되었습니다. 실제 연결 시 reports 테이블 status=submitted로 저장됩니다.</p> : null}
    </form>
  );
}
