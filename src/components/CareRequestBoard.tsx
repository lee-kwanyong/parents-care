import { demoCareRequests } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

const statusLabel = {
  received: "접수",
  triaging: "상담/분류",
  plan_ready: "플랜 준비",
  in_progress: "진행 중",
  resolved: "완료",
  cancelled: "취소"
} as const;

const channelLabel = {
  phone: "전화",
  kakao: "카톡",
  photo: "사진",
  direct: "직접입력"
} as const;

export function CareRequestBoard({ mode = "family" }: { mode?: "family" | "ops" }) {
  return (
    <div className="care-request-board stack">
      <div className="row wrap">
        <div>
          <h3>{mode === "ops" ? "운영실 걱정 요청 보드" : "접수된 부모님 걱정"}</h3>
          <p>{mode === "ops" ? "서비스명이 아니라 걱정 단위로 접수된 요청을 상담·실행 플랜으로 바꿉니다." : "전화·카톡·사진·직접 입력으로 맡긴 요청을 가족이 한눈에 봅니다."}</p>
        </div>
        <StatusBadge label="걱정 → 플랜" tone="safe" />
      </div>
      <div className="care-request-list">
        {demoCareRequests.map((request) => (
          <article className="care-request-card" key={request.id}>
            <div className="row wrap">
              <span className={`badge ${request.notSure ? "warn" : ""}`}>{request.notSure ? "잘 모르겠어요" : statusLabel[request.status]}</span>
              <small>{channelLabel[request.preferredChannel]} 접수 · {request.createdAt}</small>
            </div>
            <strong>{request.title}</strong>
            <p>{request.summary}</p>
            <div className="mini-card">
              <strong>다음 단계</strong>
              <span>{request.nextStep}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
