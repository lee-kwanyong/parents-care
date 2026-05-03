"use client";

import { useState } from "react";
import { transportModeLabels, type TransportMode } from "@/lib/types";
import { VehiclePolicyNotice } from "./VehiclePolicyNotice";

const transportModes: TransportMode[] = ["hospital_front_meet", "home_front_meet_taxi", "mobility_partner"];

export function LocalAppointmentForm() {
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [policyAck, setPolicyAck] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = `CARE-${Math.floor(1000 + Math.random() * 9000)}`;
    const payload = {
      code,
      elderName: formData.get("elderName"),
      hospital: formData.get("hospital"),
      department: formData.get("department"),
      appointmentAt: formData.get("appointmentAt"),
      meetPlace: formData.get("meetPlace"),
      transportMode: formData.get("transportMode"),
      careNeeds: formData.get("careNeeds"),
      questions: formData.get("questions"),
      policyAck,
      savedAt: new Date().toISOString()
    };
    window.localStorage.setItem("ansim-demo-appointment", JSON.stringify(payload));
    setSavedCode(code);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="grid two">
        <div className="field">
          <label htmlFor="elderName">부모님 성함</label>
          <input id="elderName" name="elderName" placeholder="예: 김영희" required />
        </div>
        <div className="field">
          <label htmlFor="hospital">병원명</label>
          <input id="hospital" name="hospital" placeholder="예: 서울튼튼병원" required />
        </div>
        <div className="field">
          <label htmlFor="department">진료과</label>
          <input id="department" name="department" placeholder="예: 정형외과" />
        </div>
        <div className="field">
          <label htmlFor="appointmentAt">진료 일시</label>
          <input id="appointmentAt" name="appointmentAt" type="datetime-local" required />
        </div>
        <div className="field">
          <label htmlFor="meetPlace">만남 장소</label>
          <input id="meetPlace" name="meetPlace" placeholder="예: 아파트 정문 / 병원 1층 접수처" />
        </div>
        <div className="field">
          <label htmlFor="transportMode">픽업/이동 방식</label>
          <select id="transportMode" name="transportMode">
            {transportModes.map((mode) => <option key={mode} value={mode}>{transportModeLabels[mode]}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="careNeeds">부모님께 필요한 도움</label>
        <textarea id="careNeeds" name="careNeeds" rows={3} placeholder="예: 오래 걷기 어려움, 접수/수납 도움 필요, 진료실 설명을 잘 놓치심" />
      </div>
      <div className="field">
        <label htmlFor="questions">보호자 질문 리스트</label>
        <textarea id="questions" name="questions" rows={4} placeholder="예: 약을 계속 먹어야 하나요? 다음 검사는 언제인가요?" />
      </div>

      <label className="policy-consent">
        <input type="checkbox" checked={policyAck} onChange={(event) => setPolicyAck(event.target.checked)} required />
        <span>차량 보유 여부는 참고 정보이며, 매니저 개인차량 직접 유상운송은 기본 서비스가 아님을 확인했습니다.</span>
      </label>

      <button type="submit" className="button">일정 저장</button>
      {savedCode ? <p className="success-message">저장되었습니다. 가족 공동조회 코드: <strong>{savedCode}</strong></p> : null}
      <VehiclePolicyNotice />
    </form>
  );
}
