import type { ConsentScope, TransportMode } from "./types";

export const appName = "부모님 안심동행 케어";

export const vehiclePolicyCopy =
  "차량 보유 여부는 참고 정보입니다. 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않으며, 기본 이동은 병원 앞 만남·집 앞 만남 후 택시 동행·이동지원 제휴 기준으로 운영합니다.";

export const transportModes: Array<{
  code: TransportMode;
  label: string;
  short: string;
  recommended: boolean;
  requiresOpsReview: boolean;
}> = [
  {
    code: "hospital_front_meet",
    label: "병원 앞 만남",
    short: "부모님이 병원으로 직접 이동",
    recommended: true,
    requiresOpsReview: false
  },
  {
    code: "home_front_meet_taxi",
    label: "집 앞 만남 후 택시 동행",
    short: "집 앞에서 만나 택시/대중교통 동행",
    recommended: true,
    requiresOpsReview: false
  },
  {
    code: "mobility_partner",
    label: "이동지원 제휴 연결",
    short: "허가된 이동지원/택시/콜 서비스 연결",
    recommended: true,
    requiresOpsReview: true
  },
  {
    code: "manager_vehicle_info_only",
    label: "매니저 차량 보유 정보 표시",
    short: "직접 운송 의미 아님",
    recommended: false,
    requiresOpsReview: true
  },
  {
    code: "direct_transport_partner",
    label: "직접 운송 제휴 서비스",
    short: "계약·보험·자격 검증된 별도 서비스",
    recommended: false,
    requiresOpsReview: true
  }
];

export const consentScopes: ConsentScope[] = [
  {
    code: "schedule",
    label: "일정 정보",
    description: "병원명, 진료과, 만남 시간, 진행 단계",
    recommended: true,
    sensitive: false
  },
  {
    code: "progress",
    label: "진행상황",
    description: "도착, 접수, 진료, 약국, 귀가 상태",
    recommended: true,
    sensitive: false
  },
  {
    code: "report_summary",
    label: "리포트 요약",
    description: "진료 내용 요약, 다음 액션, 부모님 컨디션",
    recommended: true,
    sensitive: true
  },
  {
    code: "medical_detail",
    label: "검사·약 상세",
    description: "검사 결과, 복약, 의료진 안내사항의 상세 내용",
    recommended: false,
    sensitive: true
  },
  {
    code: "payment_receipt",
    label: "비용·영수증",
    description: "진료비, 약제비, 택시비, 영수증 파일",
    recommended: false,
    sensitive: true
  }
];

export const managerChecklist = [
  "본인 확인 및 만남 암호 확인",
  "동행 동의와 공유범위 확인",
  "이동 방식 재확인: 병원 앞 만남/택시 동행/제휴 이동지원",
  "접수 위치와 진료과 확인",
  "보호자 질문 리스트 확인",
  "수납/약국/다음 예약 확인",
  "부모님 컨디션과 보행 상태 확인",
  "리포트 초안 작성 및 운영실 검수 요청"
];

export const guardianQuestionTemplates = [
  "현재 약은 계속 복용해야 하나요?",
  "다음 검사는 언제가 적절한가요?",
  "통증이 심해질 때 바로 병원에 와야 하는 신호가 있나요?",
  "보호자가 집에서 꼭 확인해야 할 행동은 무엇인가요?",
  "다음 예약 전에 준비해야 할 서류나 검사 결과가 있나요?"
];

export const reportQualityChecklist = [
  "진료 진행 내용과 의료진 안내사항이 구분되어 있음",
  "검사/약/다음 예약/비용이 빠짐없이 정리됨",
  "부모님 컨디션이 보호자가 이해할 수 있는 문장으로 기록됨",
  "가족이 해야 할 다음 액션이 담당자와 시점 기준으로 정리됨",
  "의학적 판단처럼 보이는 표현 없이 관찰/전달 중심으로 작성됨"
];
