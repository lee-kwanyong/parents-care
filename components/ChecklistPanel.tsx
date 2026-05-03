"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge";

export function ChecklistPanel({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const completeCount = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);

  return (
    <div className="card stack">
      <div className="row">
        <h3>현장 체크리스트</h3>
        <StatusBadge label={`${completeCount}/${items.length} 완료`} tone={completeCount === items.length ? "safe" : "neutral"} />
      </div>
      <ul className="checklist">
        {items.map((item) => (
          <li key={item}>
            <input
              type="checkbox"
              checked={Boolean(checked[item])}
              onChange={(event) => setChecked((current) => ({ ...current, [item]: event.target.checked }))}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
