"use client";

import { useActionState, useState } from "react";
import { createCareRequestAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { worryOptions } from "@/lib/demo-data";
import type { CareRequestChannel, CareRequestUrgency, WorryCategory } from "@/lib/types";
import { ActionStateNotice } from "./ActionStateNotice";

const channelOptions: Array<{ value: CareRequestChannel; label: string; description: string }> = [
  { value: "phone", label: "전화로 맡기기", description: "상담원이 듣고 정리" },
  { value: "kakao", label: "카톡으로 맡기기", description: "대화 내용을 붙여넣기" },
  { value: "photo", label: "사진으로 맡기기", description: "예약 문자·서류 캡처" },
  { value: "direct", label: "직접 간단 입력", description: "아는 것만 적기" }
];

const urgencyOptions: Array<{ value: CareRequestUrgency; label: string }> = [
  { value: "today", label: "오늘 바로" },
  { value: "soon", label: "이번 주 안에" },
  { value: "regular", label: "정기적으로" },
  { value: "unknown", label: "잘 모르겠어요" }
];

export function WorryIntakeHub({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState<WorryCategory>("unknown");
  const [channel, setChannel] = useState<CareRequestChannel>("phone");
  const [state, formAction, isPending] = useActionState(createCareRequestAction, idleActionState);
  const selectedOption = worryOptions.find((option) => option.category === selected) ?? worryOptions[worryOptions.length - 1];

  return (
    <section className={`worry-hub ${compact ? "compact" : ""} stack`} aria-labelledby="worry-hub-title">
      <div>
        <div className="kicker">걱정 접수센터</div>
        <h2 id="worry-hub-title">무엇이 걱정되세요?</h2>
        <p>기능명을 몰라도 괜찮습니다. 걱정만 고르면 병원·밥·약·퇴원·서류·정기진료 플랜으로 정리합니다.</p>
      </div>

      <div className="worry-choice-grid">
        {worryOptions.map((option) => (
          <button
            type="button"
            className={`worry-choice ${selected === option.category ? "active" : ""}`}
            key={option.category}
            onClick={() => setSelected(option.category)}
            aria-pressed={selected === option.category}
          >
            <span className="worry-icon" aria-hidden>{option.icon}</span>
            <strong>{option.title}</strong>
            <small>{option.description}</small>
          </button>
        ))}
      </div>

      <form className="form worry-form" action={formAction}>
        <input type="hidden" name="category" value={selected} />
        <input type="hidden" name="sourceInputType" value={channel} />
        <input type="hidden" name="notSure" value={selected === "unknown" ? "true" : "false"} />

        <div className="selected-worry-card">
          <span className="worry-icon" aria-hidden>{selectedOption.icon}</span>
          <div>
            <strong>{selectedOption.title}</strong>
            <p>{selectedOption.firstQuestion}</p>
            <small>앱이 만드는 결과: {selectedOption.outcome}</small>
          </div>
        </div>

        <div className="form-grid two-col">
          <div className="field">
            <label htmlFor="elderName">부모님 성함</label>
            <input id="elderName" name="elderName" defaultValue="이정순 어머니" required />
          </div>
          <div className="field">
            <label htmlFor="callbackPhone">연락받을 번호</label>
            <input id="callbackPhone" name="callbackPhone" placeholder="010-0000-0000" />
          </div>
        </div>

        <fieldset className="fieldset stack">
          <legend>얼마나 급한가요?</legend>
          <div className="simple-radio-grid">
            {urgencyOptions.map((option) => (
              <label className="large-radio" key={option.value}>
                <input type="radio" name="urgency" value={option.value} defaultChecked={option.value === "soon"} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fieldset stack">
          <legend>어떻게 맡길까요?</legend>
          <div className="simple-radio-grid">
            {channelOptions.map((option) => (
              <label className="large-radio" key={option.value}>
                <input
                  type="radio"
                  name="preferredChannel"
                  value={option.value}
                  checked={channel === option.value}
                  onChange={() => setChannel(option.value)}
                />
                <span><strong>{option.label}</strong><small>{option.description}</small></span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="situation">상황을 한 문장으로 적어주세요</label>
          <textarea
            id="situation"
            name="situation"
            rows={compact ? 3 : 5}
            defaultValue="다음 주 병원 예약이 있는데 제가 못 가고, 어머니가 약과 식사를 잘 챙기시는지도 걱정됩니다."
            required
          />
        </div>

        <div className="field">
          <label htmlFor="desiredHelp">원하는 도움</label>
          <textarea id="desiredHelp" name="desiredHelp" rows={3} defaultValue="병원동행, 약 확인, 필요한 서류, 다음 예약까지 정리해 주세요." />
        </div>

        <label className="policy-consent">
          <input type="checkbox" name="socialSupportRequested" />
          <span>비용 부담이 있으면 공공지원·후원 쿠폰·지역 복지 연결도 함께 안내받고 싶습니다.</span>
        </label>

        <button className="button primary-action" type="submit" disabled={isPending}>{isPending ? "접수 중..." : "부모님 걱정 접수하기"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
