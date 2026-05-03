"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

const scopes = ["일정과 진행상황", "진료 요약", "약/검사 정보", "비용", "상세 메모"];

export function ConsentScopeSelector() {
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({
    "일정과 진행상황": true,
    "진료 요약": true,
    "약/검사 정보": false,
    비용: true,
    "상세 메모": false
  });

  function save() {
    window.localStorage.setItem("ansim-demo-consent-scopes", JSON.stringify(selected));
    setSaved(true);
  }

  return (
    <div className="card stack">
      <div className="row">
        <h3>자녀에게 공유할 범위</h3>
        <StatusBadge label={saved ? "저장됨" : "확인 필요"} tone={saved ? "safe" : "warn"} />
      </div>
      <div className="grid two compact-grid">
        {scopes.map((scope) => (
          <label className="mini-card checkbox-card" key={scope}>
            <input type="checkbox" checked={selected[scope]} onChange={(event) => setSelected((current) => ({ ...current, [scope]: event.target.checked }))} />
            <strong>{scope}</strong>
          </label>
        ))}
      </div>
      <button type="button" className="button" onClick={save}>동의 범위 저장</button>
    </div>
  );
}
