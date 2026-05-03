"use client";

import { useMemo, useState, useActionState } from "react";
import { createWorryRequestAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { worryOptions, easyRequestChannels } from "@/lib/demo-data";
import type { RequestChannel, WorryCategory } from "@/lib/types";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

export function WorryIntakeCenter() {
  const [category, setCategory] = useState<WorryCategory>("not_sure");
  const [sourceChannel, setSourceChannel] = useState<RequestChannel>("phone");
  const [state, formAction, isPending] = useActionState(createWorryRequestAction, idleActionState);
  const selected = useMemo(() => worryOptions.find((item) => item.code === category) ?? worryOptions[worryOptions.length - 1], [category]);

  return (
    <section className="panel stack worry-intake">
      <div>
        <div className="kicker">걱정 접수센터</div>
        <h2>무엇이 걱정되세요?</h2>
        <p>정확한 서비스명을 몰라도 괜찮습니다. 걱정을 하나만 누르면 운영실이 필요한 케어로 정리합니다.</p>
      </div>

      <div className="worry-grid">
        {worryOptions.map((option) => (
          <button
            type="button"
            className={`worry-card ${category === option.code ? "selected" : ""}`}
            key={option.code}
            onClick={() => {
              setCategory(option.code);
              setSourceChannel(option.defaultChannel);
            }}
          >
            <span className="worry-icon">{option.icon}</span>
            <strong>{option.title}</strong>
            <small>{option.description}</small>
          </button>
        ))}
      </div>

      <div className="grid two">
        <div className="panel subtle stack">
          <div className="row wrap">
            <h3>{selected.icon} {selected.plainTitle}</h3>
            <StatusBadge label={selected.code === "not_sure" ? "괜찮아요" : "선택됨"} tone={selected.code === "not_sure" ? "warn" : "safe"} />
          </div>
          <p>{selected.description}</p>
          <ul className="feature-list">
            {selected.firstQuestions.map((question) => <li key={question}>{question}</li>)}
          </ul>
        </div>

        <form className="form" action={formAction}>
          <input type="hidden" name="category" value={category} />
          <fieldset className="fieldset stack">
            <legend>접수 방식</legend>
            <div className="choice-grid">
              {easyRequestChannels.map((channel) => (
                <label className="choice-card" key={channel.code}>
                  <input type="radio" name="sourceChannel" value={channel.code} checked={sourceChannel === channel.code} onChange={() => setSourceChannel(channel.code)} />
                  <span><strong>{channel.title}</strong><small>{channel.bestFor}</small></span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-grid two-col">
            <div className="field">
              <label htmlFor="elderName">부모님 성함</label>
              <input id="elderName" name="elderName" defaultValue="이정순" required />
            </div>
            <div className="field">
              <label htmlFor="preferredContact">연락받을 번호</label>
              <input id="preferredContact" name="preferredContact" placeholder="010-0000-0000" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="situation">상황을 편하게 적어주세요</label>
            <textarea id="situation" name="situation" rows={5} defaultValue="정확히 뭘 신청해야 할지 모르겠어요. 다음 주에 어머니 병원 일정이 있고, 식사와 약도 같이 걱정됩니다." required />
          </div>

          <fieldset className="fieldset stack">
            <legend>급한 정도</legend>
            <div className="choice-grid">
              <label className="choice-card"><input type="radio" name="urgency" value="today" /><span><strong>오늘 필요</strong><small>운영실 우선 확인</small></span></label>
              <label className="choice-card"><input type="radio" name="urgency" value="this_week" defaultChecked /><span><strong>이번 주 필요</strong><small>일정과 케어 플랜 정리</small></span></label>
              <label className="choice-card"><input type="radio" name="urgency" value="regular" /><span><strong>정기적으로 필요</strong><small>반복 케어 등록</small></span></label>
              <label className="choice-card"><input type="radio" name="urgency" value="not_sure" /><span><strong>잘 모르겠어요</strong><small>상담원이 분류</small></span></label>
            </div>
          </fieldset>

          <label className="policy-consent">
            <input type="checkbox" name="needsOpsCall" defaultChecked />
            <span>필요하면 운영실이 전화로 정리해도 됩니다.</span>
          </label>

          <button type="submit" className="button primary-action" disabled={isPending}>{isPending ? "접수 중..." : "걱정 접수하기"}</button>
          <ActionStateNotice state={state} />
        </form>
      </div>
    </section>
  );
}
