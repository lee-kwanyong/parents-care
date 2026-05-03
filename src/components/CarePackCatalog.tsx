"use client";

import { useActionState, useMemo, useState } from "react";
import { createCarePackRequestAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { careServicePacks } from "@/lib/demo-data";
import type { CarePackCode, CareRequestChannel, CareRequestUrgency } from "@/lib/types";
import { ActionStateNotice } from "./ActionStateNotice";

const channelOptions: Array<{ value: CareRequestChannel; label: string }> = [
  { value: "phone", label: "전화로 맡기기" },
  { value: "kakao", label: "카톡으로 맡기기" },
  { value: "photo", label: "사진으로 맡기기" },
  { value: "direct", label: "직접 간단 입력" }
];

const urgencyOptions: Array<{ value: CareRequestUrgency; label: string }> = [
  { value: "today", label: "오늘 바로" },
  { value: "soon", label: "이번 주 안에" },
  { value: "regular", label: "정기적으로" },
  { value: "unknown", label: "잘 모르겠어요" }
];

export function CarePackCatalog({ compact = false }: { compact?: boolean }) {
  const [selectedCode, setSelectedCode] = useState<CarePackCode>("not_sure_consult");
  const [channel, setChannel] = useState<CareRequestChannel>("phone");
  const [urgency, setUrgency] = useState<CareRequestUrgency>("soon");
  const [state, formAction, isPending] = useActionState(createCarePackRequestAction, idleActionState);
  const selectedPack = useMemo(() => {
    const fallbackPack = careServicePacks.find((pack) => pack.code === "not_sure_consult") ?? careServicePacks[0]!;
    const matchedPack = careServicePacks.find((pack) => pack.code === selectedCode);
    return matchedPack ?? fallbackPack;
  }, [selectedCode]);

  return (
    <section className={`care-pack-panel stack ${compact ? "compact" : ""}`} aria-labelledby="care-pack-title">
      <div className="row wrap">
        <div>
          <div className="kicker">생활 케어팩</div>
          <h2 id="care-pack-title">필요한 기능을 찾지 말고, 맞는 케어팩을 고르세요.</h2>
          <p>병원, 밥, 약, 퇴원, 서류, 정기진료, 안부를 단건 기능이 아니라 가족이 이해하기 쉬운 묶음으로 제공합니다.</p>
        </div>
        <span className="badge warn">간편함 중심</span>
      </div>

      <div className="care-pack-grid">
        {careServicePacks.map((pack) => (
          <button
            type="button"
            className={`care-pack-card ${selectedCode === pack.code ? "active" : ""}`}
            key={pack.code}
            onClick={() => setSelectedCode(pack.code)}
            aria-pressed={selectedCode === pack.code}
          >
            <strong>{pack.title}</strong>
            <p>{pack.oneLine}</p>
            <small>{pack.whoNeedsIt}</small>
            <span>{pack.easyStart}</span>
          </button>
        ))}
      </div>

      <form className="form pack-request-form" action={formAction}>
        <input type="hidden" name="packCode" value={selectedCode} />
        <input type="hidden" name="preferredChannel" value={channel} />
        <input type="hidden" name="urgency" value={urgency} />

        <article className="selected-pack-summary">
          <div>
            <strong>{selectedPack.title}</strong>
            <p>{selectedPack.oneLine}</p>
          </div>
          <ul className="feature-list">
            {selectedPack.includes.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <small>자녀가 받는 결과: {selectedPack.reassuranceResult}</small>
          {selectedPack.socialValue ? <small>사회공헌 연결: {selectedPack.socialValue}</small> : null}
        </article>

        <div className="form-grid two-col">
          <div className="field">
            <label htmlFor="pack-elderName">부모님 성함</label>
            <input id="pack-elderName" name="elderName" defaultValue="이정순 어머니" required />
          </div>
          <div className="field">
            <label htmlFor="pack-callbackPhone">연락받을 번호</label>
            <input id="pack-callbackPhone" name="callbackPhone" placeholder="010-0000-0000" />
          </div>
        </div>

        <fieldset className="fieldset stack">
          <legend>어떻게 맡길까요?</legend>
          <div className="simple-radio-grid">
            {channelOptions.map((option) => (
              <label className="large-radio" key={option.value}>
                <input type="radio" value={option.value} checked={channel === option.value} onChange={() => setChannel(option.value)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fieldset stack">
          <legend>언제 필요하세요?</legend>
          <div className="simple-radio-grid">
            {urgencyOptions.map((option) => (
              <label className="large-radio" key={option.value}>
                <input type="radio" value={option.value} checked={urgency === option.value} onChange={() => setUrgency(option.value)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="pack-situation">상황을 한 문장으로 적어주세요</label>
          <textarea id="pack-situation" name="situation" rows={compact ? 3 : 4} defaultValue="어머니가 병원도 걱정되고 식사와 약도 잘 챙기시는지 모르겠습니다." required />
        </div>

        <label className="policy-consent">
          <input type="checkbox" name="easyModeConfirmed" defaultChecked />
          <span>복잡한 입력은 운영실이 대신 정리하고, 저는 요약만 확인하고 싶습니다.</span>
        </label>
        <label className="policy-consent">
          <input type="checkbox" name="socialSupportRequested" />
          <span>비용 부담이 있으면 공공지원·후원 쿠폰·지역 복지 연결도 함께 안내받고 싶습니다.</span>
        </label>

        <button className="button primary-action" type="submit" disabled={isPending}>{isPending ? "접수 중..." : "케어팩으로 맡기기"}</button>
        <ActionStateNotice state={state} />
      </form>
    </section>
  );
}
