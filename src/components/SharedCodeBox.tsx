"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

export function SharedCodeBox({ code = "CARE-4821" }: { code?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="card stack">
      <div className="row">
        <h3>가족 공동조회 코드</h3>
        <StatusBadge label="활성" tone="safe" />
      </div>
      <strong className="share-code">{code}</strong>
      <p>초대받은 가족은 같은 병원 일정을 보되, 리포트 상세·비용·평가 권한은 보호자가 따로 정합니다.</p>
      <button type="button" className="ghost-button" onClick={copy}>{copied ? "복사됨" : "코드 복사"}</button>
    </div>
  );
}
