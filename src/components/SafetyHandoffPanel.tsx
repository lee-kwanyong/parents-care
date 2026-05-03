"use client";

import { useActionState } from "react";
import { completeSafetyCheckpointAction, verifyMeetingCodeAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { demoAppointment, demoSafetyHandoff, safetyCheckpoints } from "@/lib/demo-data";
import { safetyCheckpointStatusLabel } from "@/lib/safety-guard";
import type { SafetyCheckpointCode } from "@/lib/types";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

const checkpointButtons: Array<{ code: SafetyCheckpointCode; label: string; note: string }> = [
  { code: "pre_call", label: "도착 전 연락 완료", note: "도착 전 연락과 만남 장소 재확인 완료" },
  { code: "departure_confirmed", label: "이동 시작 확인", note: "차량 정책 확인 후 택시/제휴 이동으로 출발" },
  { code: "hospital_checkin", label: "병원 접수 확인", note: "접수 완료 및 대기시간 확인" },
  { code: "safe_return_close", label: "안전 종료 확인", note: "부모님 안전 귀가 또는 보호자 인계 완료" }
];

type SafetyHandoffPanelProps = {
  audience?: "child" | "parent" | "manager" | "ops";
};

export function SafetyHandoffPanel({ audience = "child" }: SafetyHandoffPanelProps) {
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyMeetingCodeAction, idleActionState);
  const [checkpointState, checkpointAction, checkpointPending] = useActionState(completeSafetyCheckpointAction, idleActionState);
  const isParent = audience === "parent";
  const isManager = audience === "manager";
  const isOps = audience === "ops";

  const visibleButtons = isParent
    ? checkpointButtons.filter((item) => item.code === "safe_return_close")
    : isManager
      ? checkpointButtons
      : checkpointButtons.filter((item) => item.code === "handoff_code" || item.code === "safe_return_close");

  return (
    <section className={`safety-panel stack ${isParent ? "parent-safety" : ""}`}>
      <div className="row wrap">
        <div>
          <div className="kicker">안심 체크인 레이어</div>
          <h2>{isParent ? "만났는지, 잘 도착했는지만 크게 확인합니다." : "만남·이동·귀가 확인이 끊기면 운영실이 즉시 개입합니다."}</h2>
          <p>
            만남 암호 확인, 필수 체크포인트, 안전 종료 확인을 분리해서 기록합니다. 단순 타임라인보다 한 단계 더 강한 현장 안전장치입니다.
          </p>
        </div>
        <div className="candidate-score small safety-score">
          <strong>{demoSafetyHandoff.handoffVerified ? 96 : 82}</strong>
          <span>안심 상태</span>
        </div>
      </div>

      <div className="safety-ledger">
        <div className="safety-ledger-item">
          <span>신원 확인</span>
          <StatusBadge label={demoSafetyHandoff.managerIdentityVerified ? "완료" : "필요"} tone={demoSafetyHandoff.managerIdentityVerified ? "safe" : "warn"} />
        </div>
        <div className="safety-ledger-item">
          <span>만남 암호</span>
          <strong className="mono">{isManager ? "입력 필요" : demoAppointment.meetingCode}</strong>
        </div>
        <div className="safety-ledger-item">
          <span>마지막 안전 이벤트</span>
          <strong>{demoSafetyHandoff.lastSafetyEvent}</strong>
        </div>
        <div className="safety-ledger-item">
          <span>다음 자동 확인</span>
          <strong>{demoSafetyHandoff.nextEscalationAt}</strong>
        </div>
      </div>

      {isManager ? (
        <form className="form safety-code-form" action={verifyAction}>
          <input type="hidden" name="appointmentId" value={demoAppointment.id} />
          <input type="hidden" name="locationLabel" value={demoAppointment.meetPlace} />
          <div className="field">
            <label htmlFor="meetingCode">부모님이 알려준 만남 암호</label>
            <input id="meetingCode" name="meetingCode" inputMode="numeric" placeholder="4자리 숫자" maxLength={8} required />
          </div>
          <div className="field">
            <label htmlFor="handoffNote">만남 메모</label>
            <input id="handoffNote" name="note" defaultValue="이름, 얼굴, 만남 암호 상호 확인" />
          </div>
          <button className="button primary-action" type="submit" disabled={verifyPending}>{verifyPending ? "확인 중..." : "만남 암호 확인"}</button>
          <ActionStateNotice state={verifyState} />
        </form>
      ) : null}

      {isParent ? (
        <div className="parent-safe-box stack">
          <p className="big-text">오늘 동행이 끝나면 아래 버튼만 눌러주세요.</p>
          <form action={checkpointAction}>
            <input type="hidden" name="appointmentId" value={demoAppointment.id} />
            <input type="hidden" name="checkpointCode" value="safe_return_close" />
            <input type="hidden" name="label" value="안전 종료 확인" />
            <input type="hidden" name="note" value="부모님이 직접 안전 종료를 확인함" />
            <button className="button primary-action safe-return-button" type="submit" disabled={checkpointPending}>
              {checkpointPending ? "확인 중..." : "집에 잘 도착했어요"}
            </button>
          </form>
          <ActionStateNotice state={checkpointState} />
        </div>
      ) : (
        <div className="checkpoint-actions">
          {visibleButtons.map((item) => (
            <form action={checkpointAction} className="checkpoint-action" key={item.code}>
              <input type="hidden" name="appointmentId" value={demoAppointment.id} />
              <input type="hidden" name="checkpointCode" value={item.code} />
              <input type="hidden" name="label" value={item.label} />
              <input type="hidden" name="note" value={item.note} />
              <button className="ghost-button" type="submit" disabled={checkpointPending}>{item.label}</button>
            </form>
          ))}
          <ActionStateNotice state={checkpointState} />
        </div>
      )}

      <div className="safety-mini-timeline">
        {safetyCheckpoints.slice(0, isOps ? safetyCheckpoints.length : 4).map((checkpoint) => (
          <div className="safety-mini-step" key={checkpoint.code}>
            <StatusBadge label={safetyCheckpointStatusLabel[checkpoint.status]} tone={checkpoint.status === "completed" ? "safe" : checkpoint.status === "pending" ? "neutral" : "danger"} />
            <strong>{checkpoint.expectedAt} · {checkpoint.label}</strong>
            <span>{checkpoint.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
