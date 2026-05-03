"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

const steps = ["집 앞 도착", "만남 암호 확인", "택시 탑승", "병원 접수 완료", "진료실 동행 완료", "약국/귀가 확인", "리포트 작성 시작"];

export function ProgressUpdater() {
  const [lastStep, setLastStep] = useState<string | null>(null);

  function update(step: string) {
    const payload = { step, occurredAt: new Date().toISOString() };
    window.localStorage.setItem("ansim-demo-progress", JSON.stringify(payload));
    setLastStep(step);
  }

  return (
    <div className="card stack">
      <div className="row">
        <h3>단계별 진행상태 업데이트</h3>
        <StatusBadge label={lastStep ? "방금 기록" : "대기"} tone={lastStep ? "safe" : "neutral"} />
      </div>
      <div className="form">
        {steps.map((step, index) => (
          <button key={step} type="button" className={index === 0 ? "button" : "ghost-button"} onClick={() => update(step)}>{step}</button>
        ))}
      </div>
      {lastStep ? <p className="success-message">최근 업데이트: {lastStep}. 실제 연결 시 timeline_events와 운영 로그에 저장됩니다.</p> : null}
    </div>
  );
}
