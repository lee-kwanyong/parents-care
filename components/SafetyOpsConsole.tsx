"use client";

import { useActionState } from "react";
import { runSafetyEscalationSweepAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

export function SafetyOpsConsole() {
  const [state, action, isPending] = useActionState(runSafetyEscalationSweepAction, idleActionState);

  return (
    <div className="safety-ops-console stack">
      <div className="row wrap">
        <div>
          <h3>운영실 SLA 스윕</h3>
          <p>예정 시간과 grace time을 넘긴 체크포인트를 risk_flags와 safety_escalations로 올립니다.</p>
        </div>
        <StatusBadge label="cron 연결 가능" tone="safe" />
      </div>
      <form action={action} className="row wrap" style={{ justifyContent: "flex-start" }}>
        <button className="button" type="submit" disabled={isPending}>{isPending ? "점검 중..." : "지연 체크포인트 점검"}</button>
        <span className="helper-text">실서비스에서는 Supabase Edge Function 또는 cron으로 주기 실행합니다.</span>
      </form>
      <ActionStateNotice state={state} />
    </div>
  );
}
