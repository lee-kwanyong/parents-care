"use client";

import { useActionState, useMemo, useState } from "react";
import { submitRatingAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { demoAppointment, demoManager } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

const dimensions = [
  ["safetyRating", "안전"],
  ["kindnessRating", "친절"],
  ["accuracyRating", "정확성"],
  ["punctualityRating", "시간준수"]
] as const;

type DimensionKey = (typeof dimensions)[number][0];

export function RatingForm() {
  const [state, formAction, isPending] = useActionState(submitRatingAction, idleActionState);
  const [scores, setScores] = useState<Record<DimensionKey, number>>({
    safetyRating: 5,
    kindnessRating: 5,
    accuracyRating: 5,
    punctualityRating: 5
  });

  const average = useMemo(() => {
    const values = Object.values(scores);
    return values.reduce((sum, score) => sum + score, 0) / values.length;
  }, [scores]);

  return (
    <form className="card stack" action={formAction}>
      <input type="hidden" name="appointmentId" value={demoAppointment.id} />
      <input type="hidden" name="managerId" value={demoManager.id} />
      <div className="row wrap">
        <div>
          <h3>동행매니저 평가</h3>
          <p>안전, 친절, 정확성, 시간준수가 매니저 안심도와 다음 배정에 반영됩니다.</p>
        </div>
        <StatusBadge label={`평균 ${average.toFixed(1)}점`} tone="safe" />
      </div>
      <div className="grid four compact-grid">
        {dimensions.map(([key, label]) => (
          <label className="mini-card" key={key}>
            <strong>{label}</strong>
            <select
              name={key}
              value={scores[key]}
              onChange={(event) => setScores((current) => ({ ...current, [key]: Number(event.target.value) }))}
            >
              {[5, 4, 3, 2, 1].map((score) => <option value={score} key={score}>{score}점</option>)}
            </select>
          </label>
        ))}
      </div>
      <div className="field">
        <label htmlFor="rating-comment">후기 또는 개선사항</label>
        <textarea id="rating-comment" name="comment" rows={4} placeholder="부모님이 느낀 안심감, 설명 정확성, 시간준수 등을 적어주세요." />
      </div>
      <button type="submit" className="button" disabled={isPending}>{isPending ? "제출 중..." : "평가 제출"}</button>
      <ActionStateNotice state={state} />
    </form>
  );
}
