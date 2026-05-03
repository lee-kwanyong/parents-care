import { consentScopes, guardianQuestionTemplates, managerChecklist, reportQualityChecklist, vehiclePolicyCopy } from "./constants";
import { enrichAssignmentCandidate } from "./product-logic";
import type { AppointmentPrepItem, AssignmentCandidate, AssistedIntakeMode, CarePassportHighlight, CarePlanStep, CareReport, CareRequest, CareServicePack, ConvenienceMetric, DocumentRequest, EasePrinciple, FamilyConvenienceAction, HospitalConvenienceGuide, ManagerTrustSummary, MealCareOption, MedicationReminder, NextVisitSuggestion, OpsMetric, PlatformDifferentiator, ReassuranceSignal, RiskFlag, SafetyCheckpoint, SafetyEscalation, SafetyHandoff, SocialCareProgram, TimelineItem, WorryOption } from "./types";

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

export const prepPackItems: AppointmentPrepItem[] = [
  {
    id: "prep-id-card",
    category: "document",
    title: "신분증 또는 모바일 신분 확인 수단",
    description: "접수·수납·서류 발급 시 필요할 수 있어 전날 가방에 넣어둡니다.",
    owner: "어머니",
    due: "전날 저녁",
    status: "ready",
    required: true,
    source: "system"
  },
  {
    id: "prep-medicine-list",
    category: "medicine",
    title: "현재 복용약 목록과 약 봉투 사진",
    description: "의료진에게 복용 중인 약을 바로 보여줄 수 있도록 매니저앱에도 노출합니다.",
    owner: "딸",
    due: "오늘 08:00 전",
    status: "missing",
    required: true,
    source: "family"
  },
  {
    id: "prep-question-list",
    category: "question",
    title: "의사에게 물어볼 질문 5개",
    description: "보호자가 등록한 질문을 진료 전 매니저가 다시 읽고 체크합니다.",
    owner: "큰아들",
    due: "진료 1시간 전",
    status: "ready",
    required: true,
    source: "family"
  },
  {
    id: "prep-payment-card",
    category: "payment",
    title: "진료비 결제수단과 현금 소액",
    description: "진료비, 약제비, 서류 발급비가 생길 수 있어 결제수단을 확인합니다.",
    owner: "어머니",
    due: "출발 전",
    status: "ready",
    required: true,
    source: "system"
  },
  {
    id: "prep-comfort",
    category: "comfort",
    title: "무릎 보호대, 물, 얇은 겉옷",
    description: "대기 시간이 길어질 때 불편함을 줄이는 물품입니다.",
    owner: "어머니",
    due: "출발 전",
    status: "optional",
    required: false,
    source: "manager"
  },
  {
    id: "prep-arrival",
    category: "arrival",
    title: "택시 하차 위치와 접수층 확인",
    description: "하차 후 엘리베이터까지의 동선을 매니저가 미리 확인합니다.",
    owner: "김안심 매니저",
    due: "만남 30분 전",
    status: "ready",
    required: true,
    source: "manager"
  }
];

export const hospitalConvenienceGuide: HospitalConvenienceGuide = {
  hospitalName: demoAppointment.hospitalName,
  address: "서울시 강남구 테헤란로 00",
  mainEntrance: "정문 자동문 진입 후 오른쪽 원무과",
  checkinFloor: "2층 정형외과 접수대",
  taxiDropoff: "정문 앞 택시 승하차 구역. 비 오는 날은 지하 1층 연결 통로 추천",
  pickupReturnSpot: "진료 후 1층 약국 옆 의자에서 쉬며 귀가 차량/택시 호출",
  wheelchairDesk: "1층 안내데스크에서 신분 확인 후 대여 가능",
  restroomHint: "2층 정형외과 접수대 뒤편, 엘리베이터 옆",
  pharmacyHint: "수납 후 병원 밖 오른쪽 30m 약국. 대기 길면 처방전 사진 먼저 공유",
  parkingHint: "보호자 차량 방문 시 지하 2층 주차, 진료 확인 후 주차 할인 등록",
  estimatedStay: "접수~수납 약 2시간 10분 예상",
  accessibilityTips: [
    "무릎 통증이 있으면 2층 접수 전 휠체어 대여 여부를 먼저 확인",
    "엘리베이터 대기 시간이 길어 계단 이동은 피하기",
    "약국 이동 전 화장실과 물 섭취 여부 확인"
  ],
  managerTips: [
    "정문 하차 후 바로 접수층으로 이동하지 말고 의자에서 2분 컨디션 확인",
    "대기번호와 예상 대기시간을 사진 없이 텍스트로 먼저 공유",
    "처방전·영수증은 공유 동의 범위 확인 후 리포트에 첨부"
  ]
};

export const familyConvenienceActions: FamilyConvenienceAction[] = [
  {
    id: "family-action-1",
    title: "약 봉투 사진 올리기",
    description: "현재 복용 중인 약이 바뀌었는지 매니저가 확인할 수 있게 사진을 업로드합니다.",
    owner: "딸",
    due: "오늘 08:00",
    status: "todo",
    priority: "high",
    source: "appointment"
  },
  {
    id: "family-action-2",
    title: "보험서류 필요 여부 결정",
    description: "진단서, 통원확인서, 진료비 세부내역서 중 필요한 서류를 선택합니다.",
    owner: "큰아들",
    due: "수납 전",
    status: "in_progress",
    priority: "medium",
    source: "family"
  },
  {
    id: "family-action-3",
    title: "저녁 약 복용 확인 전화",
    description: "귀가 후 피곤해하실 수 있어 저녁 약 복용 여부만 짧게 확인합니다.",
    owner: "가족 공동",
    due: "오늘 20:00",
    status: "todo",
    priority: "medium",
    source: "report"
  },
  {
    id: "family-action-4",
    title: "다음 물리치료 예약 후보 고르기",
    description: "리포트에 제안된 다음 예약 후보 중 가족이 가능한 시간을 선택합니다.",
    owner: "둘째",
    due: "내일 오전",
    status: "todo",
    priority: "low",
    source: "system"
  }
];

export const medicationReminders: MedicationReminder[] = [
  {
    id: "med-1",
    name: "소염진통제",
    dose: "1정",
    timing: "저녁 식후 30분",
    checkTime: "오늘 20:00",
    owner: "딸",
    status: "scheduled"
  },
  {
    id: "med-2",
    name: "위장 보호제",
    dose: "1정",
    timing: "진통제와 함께",
    checkTime: "오늘 20:00",
    owner: "딸",
    status: "scheduled"
  }
];

export const documentRequests: DocumentRequest[] = [
  {
    id: "doc-1",
    title: "진료비 영수증",
    reason: "가족 비용 정산과 보험 청구 준비",
    feeHint: "대부분 무료 또는 수납 영수증으로 대체",
    requester: "큰아들",
    status: "requested",
    shareWithFamily: true,
    requiredConsentScope: "payment_receipt"
  },
  {
    id: "doc-2",
    title: "진료비 세부내역서",
    reason: "실손보험 청구 가능성 확인",
    feeHint: "병원별 발급비 상이",
    requester: "큰아들",
    status: "needed",
    shareWithFamily: true,
    requiredConsentScope: "payment_receipt"
  },
  {
    id: "doc-3",
    title: "처방전/약 봉투 사진",
    reason: "집에서 복약 확인과 다음 진료 준비",
    feeHint: "사진 첨부",
    requester: "딸",
    status: "received",
    shareWithFamily: true,
    requiredConsentScope: "medical_detail"
  }
];

export const nextVisitSuggestions: NextVisitSuggestion[] = [
  {
    id: "next-1",
    title: "정형외과 재진",
    suggestedAt: "2026-06-17 10:20",
    reason: "의료진이 4주 후 통증 경과 확인을 안내",
    owner: "가족 공동",
    status: "suggested"
  },
  {
    id: "next-2",
    title: "물리치료 예약",
    suggestedAt: "2026-05-23 14:00",
    reason: "주 2회 물리치료 권장",
    owner: "둘째",
    status: "drafted"
  }
];

export const convenienceMetrics: ConvenienceMetric[] = [
  { label: "준비물 완료", value: "4/6", helper: "약 봉투 사진만 필요", tone: "warn" },
  { label: "가족 할 일", value: "4개", helper: "담당자·마감 지정됨", tone: "safe" },
  { label: "서류 요청", value: "3건", helper: "영수증·세부내역·처방전", tone: "safe" },
  { label: "다음 예약 후보", value: "2개", helper: "재진·물리치료", tone: "neutral" }
];

export const familyShareTemplate = `오늘 ${demoAppointment.elderName} ${demoAppointment.hospitalName} ${demoAppointment.department} 일정입니다.\n만남 ${demoAppointment.meetAt} / 장소 ${demoAppointment.meetPlace}\n이동은 ${demoAppointment.pickupLabel}이며, 매니저 개인차량 직접 운송은 기본 서비스가 아닙니다.\n준비물: 신분증, 복용약 사진, 결제수단, 질문 리스트\n진행상황과 리포트는 가족 공동조회 코드 ${demoAppointment.familyCode}로 확인합니다.`;

export const worryOptions = [
  {
    category: "hospital",
    icon: "🏥",
    title: "병원에 혼자 못 가세요",
    description: "예약 문자·진료예약증·카톡 캡처만 올리면 동행 준비, 매니저 배정, 질문 리스트, 서류까지 정리합니다.",
    firstQuestion: "병원 날짜와 장소를 알고 계신가요?",
    outcome: "병원동행 플랜 + 만남 암호 + 보호자 리포트",
    tone: "safe"
  },
  {
    category: "meal",
    icon: "🍱",
    title: "밥을 잘 못 챙겨 드세요",
    description: "식사 확인, 냉장고 확인, 도시락/저염식/회복식 연결, 가족 알림을 한 번에 묶습니다.",
    firstQuestion: "하루 몇 끼가 가장 걱정되세요?",
    outcome: "안심밥상 + 식사 확인 리포트",
    tone: "warn"
  },
  {
    category: "medication",
    icon: "💊",
    title: "약을 잘 드시는지 모르겠어요",
    description: "처방약 사진, 복용 시간, 가족 확인 담당자, 미확인 알림까지 단순하게 관리합니다.",
    firstQuestion: "새로 받은 약인가요, 평소 드시는 약인가요?",
    outcome: "복약 확인표 + 가족 알림",
    tone: "safe"
  },
  {
    category: "discharge",
    icon: "🏠",
    title: "퇴원 후 집에서 걱정돼요",
    description: "귀가 동행, 약 정리, 회복식, 통증/식사/낙상 체크, 다음 외래 확인을 7일 플랜으로 만듭니다.",
    firstQuestion: "퇴원일이 언제인가요?",
    outcome: "퇴원 후 7일 안심팩",
    tone: "warn"
  },
  {
    category: "documents",
    icon: "📄",
    title: "보험서류가 필요해요",
    description: "영수증, 세부내역서, 통원확인서, 처방전, 검사결과지 중 필요한 서류를 추천합니다.",
    firstQuestion: "보험 청구용인가요, 가족 확인용인가요?",
    outcome: "서류 요청함 + 매니저 현장 체크",
    tone: "neutral"
  },
  {
    category: "regular_visit",
    icon: "📆",
    title: "정기진료를 계속 챙겨야 해요",
    description: "혈압, 당뇨, 정형외과, 재활, 투석, 검진처럼 반복되는 진료를 케어 캘린더로 관리합니다.",
    firstQuestion: "몇 주 또는 몇 달마다 가셔야 하나요?",
    outcome: "정기진료 자동관리",
    tone: "safe"
  },
  {
    category: "unknown",
    icon: "❔",
    title: "뭘 해야 할지 모르겠어요",
    description: "정확한 서비스명을 몰라도 괜찮습니다. 상황만 말하면 필요한 도움을 운영실이 정리합니다.",
    firstQuestion: "지금 제일 걱정되는 상황을 한 문장으로 적어주세요.",
    outcome: "운영실 케어 상담 + 해결 플랜",
    tone: "warn"
  }
] satisfies WorryOption[];

export const reassuranceSignals = [
  { label: "오늘 상태", value: "안심", helper: "확인 필요한 일 없음", tone: "safe" },
  { label: "식사", value: "점심 확인", helper: "저녁은 20시에 다시 확인", tone: "safe" },
  { label: "약", value: "1건 대기", helper: "저녁 식후 약 복용 확인 필요", tone: "warn" },
  { label: "다음 할 일", value: "2개", helper: "보험서류 · 다음 물리치료 예약", tone: "neutral" }
] satisfies ReassuranceSignal[];

export const demoCareRequests = [
  {
    id: "care-req-1",
    category: "hospital",
    title: "정형외과 재진 동행 요청",
    summary: "예약 문자 사진으로 접수됨. 집 앞 만남 후 택시 동행, 영수증·처방전 사진 요청 포함.",
    urgency: "soon",
    preferredChannel: "photo",
    status: "plan_ready",
    elderName: demoAppointment.elderName,
    createdAt: "2026-05-02 14:20",
    nextStep: "보호자가 플랜 확인 후 운영실이 매니저 배정",
    notSure: false
  },
  {
    id: "care-req-2",
    category: "meal",
    title: "식사를 잘 못 챙기시는 것 같아요",
    summary: "씹기 어려움, 혼자 식사 준비 어려움. 안심밥상 정기배송 후보와 식사 확인 알림 제안.",
    urgency: "regular",
    preferredChannel: "phone",
    status: "triaging",
    elderName: demoAppointment.elderName,
    createdAt: "2026-05-02 15:05",
    nextStep: "운영실이 식사 제한과 배송 가능 지역 확인",
    notSure: true
  }
] satisfies CareRequest[];

export const oneMinuteCarePlan = [
  {
    order: 1,
    title: "걱정 접수",
    description: "사용자는 병원·밥·약·퇴원·서류·모름 중 하나만 누릅니다. 길게 쓰기 어렵다면 전화/카톡/사진으로 맡깁니다.",
    owner: "family",
    status: "done",
    dueHint: "지금"
  },
  {
    order: 2,
    title: "운영실 정리",
    description: "운영실이 필요한 정보, 부모님 케어패스포트, 동의 범위, 비용 가능성을 정리합니다.",
    owner: "ops",
    status: "in_progress",
    dueHint: "접수 후 10분 안"
  },
  {
    order: 3,
    title: "해결 플랜 제안",
    description: "병원동행, 안심밥상, 복약 확인, 퇴원 후 7일팩, 서류 요청, 가족 할 일로 나눠 자녀에게 보여줍니다.",
    owner: "system",
    status: "ready",
    dueHint: "확인만 하면 됨"
  },
  {
    order: 4,
    title: "안심 확인",
    description: "자녀는 자세한 리포트보다 먼저 안심/확인 필요/긴급 상태와 다음 액션만 봅니다.",
    owner: "family",
    status: "waiting",
    dueHint: "진행 중"
  }
] satisfies CarePlanStep[];

export const carePassportHighlights = [
  { label: "거동", value: "천천히 걸으심", helper: "계단보다 엘리베이터, 긴 대기 시 의자 필요", visibility: "manager" },
  { label: "청력", value: "오른쪽 잘 안 들림", helper: "왼쪽에서 천천히 설명하면 편안해하심", visibility: "manager" },
  { label: "식사", value: "딱딱한 음식 어려움", helper: "죽/연화식/부드러운 반찬 선호", visibility: "family" },
  { label: "약", value: "혈압약 복용 중", helper: "새 처방약과 중복 여부 확인 필요", visibility: "ops" },
  { label: "응대", value: "존칭·짧은 설명 선호", helper: "돌봄/감시라는 표현보다 도움/안심 표현 사용", visibility: "manager" },
  { label: "주의", value: "낙상 조심", helper: "화장실·병원 계단·택시 승하차 시 팔 보조", visibility: "manager" }
] satisfies CarePassportHighlight[];

export const mealCareOptions = [
  {
    title: "식사 확인만 하기",
    description: "부모님앱 큰 버튼 또는 전화로 ‘드셨어요/못 드셨어요’만 확인합니다.",
    suitableFor: "가끔 확인이 필요한 부모님",
    actionLabel: "식사 확인 시작"
  },
  {
    title: "안심밥상 정기배송",
    description: "도시락·밑반찬·죽·연화식·저염식 후보를 지역과 상태에 맞춰 연결합니다.",
    suitableFor: "혼자 장보기·요리가 어려운 부모님",
    actionLabel: "배송 상담"
  },
  {
    title: "퇴원 후 회복식 7일",
    description: "퇴원 후 일주일 동안 회복식과 약·컨디션 확인을 같이 묶습니다.",
    suitableFor: "수술/입원 후 회복 중인 부모님",
    actionLabel: "7일팩 보기"
  }
] satisfies MealCareOption[];

export const socialCarePrograms = [
  {
    title: "취약가정 안심 쿠폰",
    description: "경제적 부담이 큰 가족에게 병원동행·식사 확인 일부를 후원 쿠폰으로 지원합니다.",
    target: "저소득·독거·긴급 돌봄 공백 가정",
    appAction: "운영실 심사 후 쿠폰 발급"
  },
  {
    title: "지역 공공서비스 안내",
    description: "공공 병원동행, 도시락, 방문요양, 복지관 프로그램을 앱 안에서 안내하고 연결합니다.",
    target: "민간 서비스 비용이 부담되는 가정",
    appAction: "지역 기반 안내 카드 제공"
  },
  {
    title: "무료 안부 확인 캠페인",
    description: "정기 결제 전이라도 고위험 부모님께 주 1회 안부 확인을 제공할 수 있게 설계합니다.",
    target: "식사·약·안부가 걱정되는 독거 부모님",
    appAction: "안부 확인 신청 접수"
  }
] satisfies SocialCareProgram[];

export const simpleUxRules = [
  "첫 화면은 기능명이 아니라 걱정 선택으로 시작",
  "모든 핵심 행동은 3번 안에 완료",
  "전화·카톡·사진 접수를 항상 제공",
  "부모님 화면은 큰 글씨와 큰 버튼만 유지",
  "자녀는 자세한 기록보다 안심/확인 필요/긴급을 먼저 확인",
  "사회공헌 연결이 필요한 가정은 운영실이 먼저 제안"
];


export const platformDifferentiators = [
  {
    title: "매칭이 아니라 걱정 해결",
    oldView: "사용자가 병원동행, 간병, 식사, 서류 중 필요한 기능을 직접 찾아야 함",
    ourView: "사용자는 ‘무엇이 걱정되는지’만 고르고, 앱과 운영실이 해결 플랜으로 바꿈",
    whyItMatters: "40대 이상 사용자는 기능명을 찾는 순간 피로해집니다. 걱정 선택은 진입장벽을 낮춥니다."
  },
  {
    title: "병원 가는 날 전·중·후를 한 번에",
    oldView: "동행 당일 매니저 연결과 리포트에서 끝남",
    ourView: "준비물, 만남 암호, 진료, 약, 서류, 식사, 다음 예약, 가족 할 일까지 이어짐",
    whyItMatters: "부모님 케어의 불안은 병원 도착이 아니라 집에 돌아온 뒤에도 계속됩니다."
  },
  {
    title: "부모님을 알수록 좋아지는 케어",
    oldView: "매번 새로운 매칭과 반복 설명",
    ourView: "케어패스포트가 거동, 청력, 식사, 약, 말투, 낙상 주의를 다음 케어에 반영",
    whyItMatters: "돌봄은 사람 이해가 품질입니다. 데이터가 쌓일수록 가족이 덜 설명해도 됩니다."
  },
  {
    title: "앱을 못 써도 이용 가능",
    oldView: "예약 폼을 사용자가 끝까지 작성해야 함",
    ourView: "전화, 카톡, 사진, 직접입력 중 편한 방식으로 맡김",
    whyItMatters: "조금만 어려우면 이탈하는 40대 이상 고객에게 운영실 대행 접수는 핵심 기능입니다."
  },
  {
    title: "사회공헌이 제품 구조에 포함",
    oldView: "결제 가능한 고객 중심의 단건 서비스",
    ourView: "취약가정 쿠폰, 공공서비스 안내, 무료 안부 확인, 지역 복지 연결을 함께 설계",
    whyItMatters: "돈보다 돌봄 공백 해소가 중요한 서비스 철학이 앱 기능 안에 들어갑니다."
  }
] satisfies PlatformDifferentiator[];

export const assistedIntakeModes = [
  {
    code: "phone",
    title: "전화로 맡기기",
    description: "상담원이 상황을 듣고 병원·식사·약·서류·퇴원 케어로 정리합니다.",
    bestFor: "앱 입력이 귀찮거나 부모님 상황이 복잡한 가족",
    result: "상담 후 1분 요약 플랜 생성"
  },
  {
    code: "kakao",
    title: "카톡으로 맡기기",
    description: "가족 카톡방 내용이나 병원 예약 안내 문자를 붙여넣습니다.",
    bestFor: "이미 카톡에 정보가 흩어져 있는 가족",
    result: "필요 정보 추출 후 일정·준비물·가족 할 일 정리"
  },
  {
    code: "photo",
    title: "사진으로 맡기기",
    description: "예약증, 처방전, 영수증, 약 봉투 사진을 올리면 운영실이 정리합니다.",
    bestFor: "텍스트 입력보다 사진 촬영이 편한 가족",
    result: "서류·약·다음 예약 후보 자동 정리"
  },
  {
    code: "direct",
    title: "직접 간단 입력",
    description: "아는 것만 적고 모르는 부분은 ‘잘 모르겠어요’로 남깁니다.",
    bestFor: "빠르게 접수하고 싶은 가족",
    result: "부족한 정보는 운영실이 콜백으로 확인"
  }
] satisfies AssistedIntakeMode[];

export const careServicePacks = [
  {
    code: "hospital_day",
    title: "병원 가는 날 안심팩",
    oneLine: "병원 일정, 만남 암호, 진료 동행, 약국, 귀가 확인을 한 번에 맡깁니다.",
    whoNeedsIt: "자녀가 병원에 동행하기 어려운 가족",
    includes: ["사진/전화 예약 접수", "만남 암호", "현장 타임라인", "진료 리포트", "약/서류/다음 예약 확인"],
    easyStart: "예약 문자나 병원 카톡만 올리면 시작",
    reassuranceResult: "오늘 상태가 안심/확인 필요/긴급으로 표시"
  },
  {
    code: "meal_subscription",
    title: "안심밥상 케어",
    oneLine: "식사 확인, 도시락·밑반찬·죽·회복식 연결을 가족 알림과 묶습니다.",
    whoNeedsIt: "혼자 요리하기 어렵거나 식사를 자주 거르는 부모님",
    includes: ["아침/점심/저녁 확인", "식사 미확인 알림", "정기배송 상담", "저염식/연화식/회복식 메모", "주간 식사 리포트"],
    easyStart: "점심 드셨어요 버튼 하나로 시작",
    reassuranceResult: "식사 확인 여부가 자녀 홈에 바로 표시",
    socialValue: "결식 위험이 있는 어르신에게 공공·후원 식사 연결 가능"
  },
  {
    code: "medication_check",
    title: "약 챙김 안심팩",
    oneLine: "처방약 사진, 복용 시간, 먹었어요 확인, 미확인 알림을 단순하게 관리합니다.",
    whoNeedsIt: "약을 깜빡하거나 새 처방약이 자주 바뀌는 부모님",
    includes: ["약 봉투 사진", "복용 시간표", "먹었어요 버튼", "가족 담당자", "미확인 알림"],
    easyStart: "약 봉투 사진 한 장으로 시작",
    reassuranceResult: "아침/점심/저녁 약 확인 상태 표시"
  },
  {
    code: "discharge_7days",
    title: "퇴원 후 7일 안심팩",
    oneLine: "퇴원 당일부터 7일 동안 식사, 약, 통증, 낙상, 다음 외래를 확인합니다.",
    whoNeedsIt: "입원·수술·골절 후 집에서 지내는 부모님",
    includes: ["귀가 동행", "처방약 정리", "회복식 상담", "컨디션 확인", "낙상 위험 체크", "다음 외래 정리"],
    easyStart: "퇴원 예정일만 알려주면 운영실이 플랜 생성",
    reassuranceResult: "7일 최종 안심 리포트 제공"
  },
  {
    code: "documents_insurance",
    title: "보험서류 챙김팩",
    oneLine: "영수증, 세부내역서, 통원확인서, 처방전, 검사결과지를 목적별로 챙깁니다.",
    whoNeedsIt: "실손보험, 가족 정산, 다음 병원 제출 서류가 필요한 가족",
    includes: ["필요 서류 추천", "부모님 동의 범위 확인", "현장 요청 체크", "서류 수령 상태", "가족 공유"],
    easyStart: "‘잘 모르겠어요, 추천해주세요’ 선택 가능",
    reassuranceResult: "빠진 서류가 있는지 운영실이 검수"
  },
  {
    code: "regular_visit",
    title: "정기진료 자동관리",
    oneLine: "혈압, 당뇨, 재활, 안과 등 반복 진료를 케어 캘린더로 관리합니다.",
    whoNeedsIt: "매달 또는 매주 병원 예약이 반복되는 부모님",
    includes: ["진료 주기 기록", "다음 예약 후보", "같은 매니저 우선", "가족 역할 배분", "자동 리마인드"],
    easyStart: "마지막 진료 리포트에서 다음 예약 후보 생성",
    reassuranceResult: "다음 진료를 놓치지 않게 확인 필요로 표시"
  },
  {
    code: "companionship_checkin",
    title: "정기 안부 확인",
    oneLine: "전화, 문자, 큰 버튼으로 식사·약·컨디션 안부를 부담 없이 확인합니다.",
    whoNeedsIt: "혼자 계시는 시간이 길고 가족이 자주 확인하기 어려운 부모님",
    includes: ["주 1~3회 안부", "식사/약 질문", "부모님 부담 없는 표현", "긴급 전환", "가족 요약 알림"],
    easyStart: "원하는 요일과 시간만 선택",
    reassuranceResult: "이번 주 안부 확인 상태 표시",
    socialValue: "무료 안부 캠페인과 연결 가능"
  },
  {
    code: "not_sure_consult",
    title: "뭘 해야 할지 모르겠어요 상담",
    oneLine: "부모님 상황만 말하면 운영실이 필요한 케어 조합을 제안합니다.",
    whoNeedsIt: "병원, 식사, 약, 퇴원, 서류 중 뭘 신청해야 할지 모르는 가족",
    includes: ["상황 듣기", "걱정 분류", "케어패스포트 확인", "서비스 조합 제안", "비용 부담 시 공공/후원 연결"],
    easyStart: "전화 버튼 하나로 시작",
    reassuranceResult: "가족이 바로 확인할 수 있는 1분 해결 플랜",
    socialValue: "돌봄 사각지대 가족에게 길 안내 역할"
  }
] satisfies CareServicePack[];

export const fortyPlusEasePrinciples = [
  {
    label: "첫 화면",
    rule: "기능 메뉴가 아니라 걱정 선택으로 시작한다.",
    productCheck: "홈 첫 CTA는 부모님 걱정 맡기기, 밥·약 확인, 리포트, 케어패스포트 네 개만 유지"
  },
  {
    label: "입력",
    rule: "전화·카톡·사진으로 대체할 수 있어야 한다.",
    productCheck: "모든 핵심 접수 폼에는 전화/카톡/사진/직접입력 선택지를 제공"
  },
  {
    label: "판단",
    rule: "사용자가 진행상황을 해석하지 않게 한다.",
    productCheck: "상태는 안심/확인 필요/긴급 세 단계로 먼저 보여주고, 상세는 접어둠"
  },
  {
    label: "부모님 화면",
    rule: "부모님은 앱을 배우지 않는다.",
    productCheck: "큰 글씨, 큰 버튼, 오늘 일정, 만남 암호, 전화, 도움, 귀가 확인만 노출"
  },
  {
    label: "사회공헌",
    rule: "비용이 부담되는 가족도 길을 잃지 않게 한다.",
    productCheck: "공공지원·후원쿠폰·지역 복지 연결을 접수 플로우에 포함"
  }
] satisfies EasePrinciple[];
