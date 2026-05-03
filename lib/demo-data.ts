import { consentScopes, guardianQuestionTemplates, managerChecklist, reportQualityChecklist, vehiclePolicyCopy } from "./constants";
import { enrichAssignmentCandidate } from "./product-logic";
import type { AssignmentCandidate, CareReport, ManagerTrustSummary, OpsMetric, RiskFlag, SafetyCheckpoint, SafetyEscalation, SafetyHandoff, TimelineItem } from "./types";

export { consentScopes, guardianQuestionTemplates, managerChecklist as defaultChecklist, reportQualityChecklist, vehiclePolicyCopy };

export const demoAppointment = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "서울튼튼병원 정형외과 재진",
  elderName: "이정순 어머니",
  hospitalName: "서울튼튼병원",
  department: "정형외과",
  appointmentAt: "2026-05-20 10:30",
  meetAt: "2026-05-20 08:40",
  meetPlace: "어머니 자택 1층 공동현관 앞",
  meetingCode: "4821",
  pickupMethod: "home_front_meet_taxi",
  pickupLabel: "집 앞 만남 후 택시 동행",
  familyCode: "CARE-4821",
  consentStatus: "동의 범위 확인 완료",
  reportStatus: "운영실 검수 후 발송"
} as const;

export const demoManager: ManagerTrustSummary = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "김안심 매니저",
  trustScore: 94,
  approved: true,
  completedCount: 148,
  ratingAverage: 4.8,
  specialties: ["정형외과", "내과", "검진센터"],
  regions: ["강남구", "서초구", "송파구"],
  hasVehicle: true,
  directTransportAllowed: false,
  transportModeLabel: "집 앞 만남 후 택시 동행",
  verificationBadges: ["신원 확인", "경력 확인", "리포트 품질 우수", "응급처치 교육"],
  lastBackgroundCheckAt: "2026-04-10",
  reportQualityScore: 93,
  openRiskCount: 0
};

const rawCandidates: Array<Omit<AssignmentCandidate, "fitScore" | "recommendation" | "reason">> = [
  {
    ...demoManager,
    available: true,
    distanceKm: 2.4,
    specialtyMatch: 1,
    regionMatch: true,
    scheduleConflict: false,
    riskPenalty: 0
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "박동행 매니저",
    trustScore: 86,
    approved: true,
    completedCount: 82,
    ratingAverage: 4.6,
    specialties: ["내과", "약국 동선", "검진센터"],
    regions: ["강남구", "용산구"],
    hasVehicle: false,
    directTransportAllowed: false,
    transportModeLabel: "병원 앞 만남",
    verificationBadges: ["신원 확인", "리포트 교육"],
    lastBackgroundCheckAt: "2026-03-22",
    reportQualityScore: 87,
    openRiskCount: 1,
    available: true,
    distanceKm: 4.8,
    specialtyMatch: 0.65,
    regionMatch: true,
    scheduleConflict: false,
    riskPenalty: 6
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "최케어 매니저",
    trustScore: 79,
    approved: true,
    completedCount: 54,
    ratingAverage: 4.4,
    specialties: ["정형외과", "휠체어 동선"],
    regions: ["송파구", "강동구"],
    hasVehicle: true,
    directTransportAllowed: false,
    transportModeLabel: "이동지원 제휴 연결",
    verificationBadges: ["신원 확인", "보행보조 교육"],
    lastBackgroundCheckAt: "2026-02-18",
    reportQualityScore: 76,
    openRiskCount: 0,
    available: false,
    distanceKm: 8.3,
    specialtyMatch: 0.95,
    regionMatch: false,
    scheduleConflict: true,
    riskPenalty: 0
  }
];

export const assignmentCandidates = rawCandidates.map(enrichAssignmentCandidate);

export const demoTimeline: TimelineItem[] = [
  {
    time: "08:10",
    title: "도착 전 안내",
    description: "매니저가 어머니에게 도착 전 전화를 드리고 만남 위치를 재확인합니다.",
    status: "완료",
    tone: "safe"
  },
  {
    time: "08:40",
    title: "집 앞 만남·암호 확인",
    description: "어머니와 매니저가 이름, 얼굴, 만남 암호 4821을 서로 확인합니다.",
    status: "예정",
    tone: "neutral"
  },
  {
    time: "08:50",
    title: "택시 동행 이동",
    description: "매니저 개인차량 유상운송이 아니라 택시 동행 방식으로 이동합니다.",
    status: "정책 확인",
    tone: "warn"
  },
  {
    time: "09:30",
    title: "병원 접수",
    description: "접수, 대기번호, 예상 대기시간을 보호자와 운영실 타임라인에 공유합니다.",
    status: "대기",
    tone: "neutral"
  },
  {
    time: "10:30",
    title: "정형외과 진료",
    description: "보호자 질문 리스트를 확인하고 의료진 안내사항을 구분해서 기록합니다.",
    status: "예정",
    tone: "neutral"
  },
  {
    time: "12:30",
    title: "리포트 검수·발송",
    description: "운영실이 리포트 초안을 검수한 뒤 보호자에게 발송합니다.",
    status: "리포트 예정",
    tone: "safe"
  }
];

export const demoReport: CareReport = {
  visitSummary: "무릎 통증 경과 확인을 위해 정형외과 외래 진료를 진행했습니다. 접수와 진료실 이동, 수납, 약국 방문까지 매니저가 동행했습니다.",
  doctorInstructions: ["무릎 사용량 조절", "물리치료 주 2회 권장", "통증이 갑자기 심해지면 조기 내원"],
  tests: ["X-ray 확인: 큰 변화 없음", "혈압 측정: 정상 범위"],
  medications: ["소염진통제 5일분", "위장 보호제 5일분"],
  nextAppointment: "2026-05-20 10:20 정형외과 재진",
  cost: "진료비 8,600원 / 약제비 4,200원 / 택시비 실비 별도",
  parentCondition: "대기 시간이 길어 약간 피곤해하셨으나 귀가 시 보행은 안정적이었습니다.",
  guardianNextActions: ["물리치료 예약 가능 시간 확인", "저녁 약 복용 여부 전화 확인", "다음 예약일 가족 캘린더 등록"],
  status: "sent",
  reviewedBy: "운영실 한케어",
  qualityScore: 96
};

export const guardianQuestions = guardianQuestionTemplates;

export const opsMetrics: OpsMetric[] = [
  { label: "오늘 일정", value: "18건", helper: "확정 13 · 검수 3 · 위험 2", tone: "safe" },
  { label: "평균 응답", value: "4분", helper: "보호자 문의 첫 응답", tone: "safe" },
  { label: "리포트 검수", value: "92%", helper: "30분 내 승인율", tone: "safe" },
  { label: "오픈 리스크", value: "3건", helper: "직접운송 1 · 동의 1 · 지연 1", tone: "warn" }
];

export const riskFlags: RiskFlag[] = [
  {
    id: "risk-1",
    severity: "critical",
    status: "open",
    code: "DIRECT_TRANSPORT_REQUESTED",
    title: "보호자가 매니저 개인차량 이동을 요청",
    description: "차량 보유 정보가 직접 운송으로 오해될 가능성이 있어, 기본 이동 방식을 택시 동행 또는 제휴 이동지원으로 재확인해야 합니다.",
    owner: "운영실 책임자",
    due: "배정 확정 전",
    playbook: ["보호자에게 정책 문구 안내", "이동 방식을 택시 동행으로 변경", "알림톡 템플릿 재발송", "운영 로그 남기기"]
  },
  {
    id: "risk-2",
    severity: "high",
    status: "reviewing",
    code: "CONSENT_SCOPE_PENDING",
    title: "검사·약 상세 공유 동의 미완료",
    description: "부모님앱에서 리포트 상세 공유 범위가 아직 확인되지 않았습니다. 요약 리포트만 먼저 발송하는 옵션을 검토합니다.",
    owner: "상담 운영자",
    due: "리포트 발송 전",
    playbook: ["부모님앱 큰 글씨 동의 확인", "자녀에게 공유 범위 설명", "동의 로그 저장"]
  },
  {
    id: "risk-3",
    severity: "medium",
    status: "open",
    code: "REPORT_QUALITY_CHECK",
    title: "리포트에 다음 액션 담당자가 없음",
    description: "가족이 해야 할 다음 액션이 있지만 담당자와 시점이 누락되어 운영실 검수에서 보완 요청이 필요합니다.",
    owner: "리포트 검수자",
    due: "발송 10분 전",
    playbook: ["다음 액션 담당자 지정", "마감 시점 추가", "가족 공동조회에 노출"]
  }
];

export const notificationPreview = [
  { channel: "알림톡", title: "매니저 배정 완료", body: "김안심 매니저가 배정되었습니다. 차량 보유는 직접 운송 의미가 아닙니다." },
  { channel: "앱 알림", title: "병원 접수 완료", body: "09:32 접수 완료. 예상 대기시간은 약 25분입니다." },
  { channel: "문자", title: "리포트 발송", body: "운영실 검수 완료 후 보호자 리포트가 발송되었습니다." }
];


export const demoSafetyHandoff: SafetyHandoff = {
  appointmentId: demoAppointment.id,
  meetingCode: demoAppointment.meetingCode,
  managerIdentityVerified: true,
  handoffVerified: false,
  parentConfirmed: false,
  managerConfirmed: false,
  safeReturnConfirmed: false,
  lastSafetyEvent: "08:12 도착 전 전화 완료",
  nextEscalationAt: "08:50"
};

export const safetyCheckpoints: SafetyCheckpoint[] = [
  {
    code: "pre_call",
    label: "도착 전 연락",
    description: "매니저가 부모님 또는 보호자에게 도착 전 전화를 하고 만남 장소를 재확인합니다.",
    expectedAt: "08:10",
    graceMinutes: 10,
    requiredBy: "manager",
    status: "completed",
    completedAt: "08:12",
    visibleToFamily: true,
    escalationOwner: "상담 운영자"
  },
  {
    code: "handoff_code",
    label: "만남 암호 상호확인",
    description: "부모님과 매니저가 이름·얼굴·암호를 함께 확인해야 실제 만남으로 인정됩니다.",
    expectedAt: "08:40",
    graceMinutes: 10,
    requiredBy: "manager",
    status: "pending",
    visibleToFamily: true,
    escalationOwner: "운영실 책임자"
  },
  {
    code: "departure_confirmed",
    label: "이동 시작 확인",
    description: "택시 동행 또는 제휴 이동지원 출발 여부를 보호자 타임라인에 남깁니다.",
    expectedAt: "08:50",
    graceMinutes: 10,
    requiredBy: "manager",
    status: "pending",
    visibleToFamily: true,
    escalationOwner: "상담 운영자"
  },
  {
    code: "hospital_checkin",
    label: "병원 접수 확인",
    description: "접수 완료, 대기번호, 예상 대기시간을 자녀가 볼 수 있게 기록합니다.",
    expectedAt: "09:30",
    graceMinutes: 15,
    requiredBy: "manager",
    status: "pending",
    visibleToFamily: true,
    escalationOwner: "현장 운영자"
  },
  {
    code: "doctor_consult_update",
    label: "진료 진행 확인",
    description: "보호자 질문 리스트와 의료진 안내사항 기록이 시작됐는지 확인합니다.",
    expectedAt: "10:45",
    graceMinutes: 25,
    requiredBy: "manager",
    status: "pending",
    visibleToFamily: true,
    escalationOwner: "리포트 검수자"
  },
  {
    code: "pharmacy_payment",
    label: "수납·약국 확인",
    description: "비용, 약, 다음 예약, 영수증 여부를 빠짐없이 정리합니다.",
    expectedAt: "12:00",
    graceMinutes: 30,
    requiredBy: "manager",
    status: "pending",
    visibleToFamily: true,
    escalationOwner: "리포트 검수자"
  },
  {
    code: "safe_return_close",
    label: "안전 종료 확인",
    description: "부모님이 안전하게 귀가했거나 보호자에게 인계됐는지 확인해야 일정이 닫힙니다.",
    expectedAt: "12:50",
    graceMinutes: 30,
    requiredBy: "parent",
    status: "pending",
    visibleToFamily: true,
    escalationOwner: "운영실 책임자"
  }
];

export const safetyEscalations: SafetyEscalation[] = [
  {
    id: "safety-1",
    checkpointCode: "handoff_code",
    severity: "high",
    status: "open",
    trigger: "만남 예정 10분 후에도 암호 확인 없음",
    owner: "운영실 책임자",
    fallbackAction: "매니저 전화 → 부모님 전화 → 보호자 전화 → 대체 매니저 후보 확인"
  },
  {
    id: "safety-2",
    checkpointCode: "safe_return_close",
    severity: "critical",
    status: "acknowledged",
    trigger: "귀가 예정 30분 후에도 안전 종료 확인 없음",
    owner: "사고 대응 담당",
    fallbackAction: "부모님/매니저 동시 연락, 필요 시 119 또는 보호자 직접 연락 안내"
  }
];

export const backupDispatchPlaybook = [
  "만남 암호 미확인 또는 매니저 연락두절 시 10분 안에 운영실이 1차 연락",
  "15분 초과 시 같은 지역 승인 매니저 후보 2명에게 대체 가능 여부 확인",
  "보호자에게 지연 사유, 새 만남 예상시간, 이동 방식 정책을 즉시 안내",
  "대체 배정 또는 일정 취소가 결정되면 risk_flags와 audit_logs에 조치 기록"
];

export const serviceBlueprint = [
  ["예약", "자녀가 병원 일정·질문·이동 방식을 입력"],
  ["동의", "부모님앱에서 큰 글씨로 동행/공유범위 확인"],
  ["배정", "운영실이 지역·전문분야·안심도·리스크로 추천 확인"],
  ["현장", "매니저가 만남 암호와 안전 체크포인트를 업데이트"],
  ["SLA", "업데이트 지연 시 운영실이 연락·대체 배정 확인"],
  ["검수", "운영실이 리포트와 리스크 로그를 확인"],
  ["평가", "자녀 평가가 매니저 안심도와 다음 배정에 반영"]
] as const;
