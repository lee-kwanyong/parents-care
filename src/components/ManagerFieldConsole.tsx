"use client";

import { useActionState } from "react";
import { submitReportDraftAction, updateProgressAction } from "@/app/actions";
import { idleActionState } from "@/lib/action-state";
import { defaultChecklist, demoAppointment, guardianQuestions } from "@/lib/demo-data";
import { ActionStateNotice } from "./ActionStateNotice";
import { StatusBadge } from "./StatusBadge";

export function ManagerFieldConsole() {
  const [progressState, progressAction, progressPending] = useActionState(updateProgressAction, idleActionState);
  const [reportState, reportAction, reportPending] = useActionState(submitReportDraftAction, idleActionState);

  return (
    <div className="grid two">
      <section className="panel stack">
        <div className="row wrap">
          <div>
            <h2>현장 진행 콘솔</h2>
            <p>상태 업데이트는 자녀 타임라인과 운영실 로그에 동시에 남는 구조입니다.</p>
          </div>
          <StatusBadge label="오늘 배정" tone="safe" />
        </div>
        <form className="form" action={progressAction}>
          <input type="hidden" name="appointmentId" value={demoAppointment.id} />
          <div className="field">
            <label htmlFor="status">진행 단계</label>
            <select id="status" name="status" defaultValue="checked_in">
              <option value="arrived">도착 전 연락</option>
              <option value="picked_up">만남/암호 확인</option>
              <option value="checked_in">병원 접수</option>
              <option value="doctor_consult">진료 진행</option>
              <option value="pharmacy">약국/수납</option>
              <option value="completed">귀가/완료</option>
              <option value="exception">예외상황</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="label">보호자에게 보일 제목</label>
            <input id="label" name="label" defaultValue="병원 접수 완료" required />
          </div>
          <div className="field">
            <label htmlFor="description">상세 메모</label>
            <textarea id="description" name="description" rows={3} defaultValue="대기번호 37번, 예상 대기시간은 약 25분입니다." />
          </div>
          <label className="checkbox-line"><input type="checkbox" name="visibleToFamily" defaultChecked /> 보호자에게 바로 공개</label>
          <button className="button" type="submit" disabled={progressPending}>{progressPending ? "업데이트 중..." : "진행상태 업데이트"}</button>
          <ActionStateNotice state={progressState} />
        </form>
      </section>

      <section className="panel stack">
        <h2>현장 체크리스트</h2>
        <ul className="checklist rich">
          {defaultChecklist.map((item, index) => (
            <li key={item}>
              <input type="checkbox" defaultChecked={index < 2} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="report-section highlight">
          <h3>보호자 질문 리스트</h3>
          <ul>
            {guardianQuestions.map((question) => <li key={question}>{question}</li>)}
          </ul>
        </div>
      </section>

      <section className="panel stack grid-span-2">
        <div className="row wrap">
          <div>
            <h2>리포트 초안 작성</h2>
            <p>운영실 검수 전 상태로 저장하고, 검수 승인 후 보호자에게 발송합니다.</p>
          </div>
          <StatusBadge label="검수 필수" tone="warn" />
        </div>
        <form className="form advanced-form" action={reportAction}>
          <input type="hidden" name="appointmentId" value={demoAppointment.id} />
          <div className="field">
            <label htmlFor="visitSummary">진료 진행 내용</label>
            <textarea id="visitSummary" name="visitSummary" rows={3} defaultValue="정형외과 외래 진료를 진행했고 접수, 진료실 이동, 수납, 약국까지 동행했습니다." required />
          </div>
          <div className="form-grid two-col">
            <div className="field">
              <label htmlFor="doctorInstructions">의료진 안내사항</label>
              <textarea id="doctorInstructions" name="doctorInstructions" rows={4} defaultValue="무릎 사용량 조절\n물리치료 주 2회 권장\n통증이 갑자기 심해지면 조기 내원" required />
            </div>
            <div className="field">
              <label htmlFor="guardianNextActions">가족이 해야 할 다음 액션</label>
              <textarea id="guardianNextActions" name="guardianNextActions" rows={4} defaultValue="물리치료 예약 가능 시간 확인\n저녁 약 복용 여부 전화 확인\n다음 예약일 가족 캘린더 등록" required />
            </div>
            <div className="field">
              <label htmlFor="testsAndResults">검사/결과</label>
              <textarea id="testsAndResults" name="testsAndResults" rows={3} defaultValue="X-ray 확인: 큰 변화 없음\n혈압 측정: 정상 범위" />
            </div>
            <div className="field">
              <label htmlFor="medicationNote">약/처방</label>
              <textarea id="medicationNote" name="medicationNote" rows={3} defaultValue="소염진통제 5일분\n위장 보호제 5일분" />
            </div>
            <div className="field">
              <label htmlFor="costNote">비용</label>
              <textarea id="costNote" name="costNote" rows={2} defaultValue="진료비 8,600원 / 약제비 4,200원 / 택시비 실비 별도" />
            </div>
            <div className="field">
              <label htmlFor="parentCondition">부모님 컨디션</label>
              <textarea id="parentCondition" name="parentCondition" rows={2} defaultValue="대기 시간이 길어 약간 피곤해하셨으나 귀가 시 보행은 안정적이었습니다." required />
            </div>
          </div>
          <button className="button primary-action" type="submit" disabled={reportPending}>{reportPending ? "제출 중..." : "운영실 검수 요청"}</button>
          <ActionStateNotice state={reportState} />
        </form>
      </section>
    </div>
  );
}
