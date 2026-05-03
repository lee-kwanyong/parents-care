export type AppRole = "child" | "parent" | "manager" | "ops" | "admin";

export type AppointmentStatus =
  | "draft"
  | "requested"
  | "manager_assigned"
  | "consent_pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "reported"
  | "reviewed"
  | "cancelled";

export type TransportMode =
  | "hospital_front_meet"
  | "home_front_meet_taxi"
  | "mobility_partner"
  | "manager_vehicle_info_only"
  | "direct_transport_partner";

export type TaskStatus = "todo" | "in_progress" | "done" | "skipped";
export type NotificationChannel = "app" | "sms" | "alimtalk" | "email";
export type EmergencyStatus = "open" | "acknowledged" | "resolved" | "false_alarm";
export type PaymentStatus = "draft" | "authorized" | "paid" | "cancelled" | "refunded" | "failed";
export type ReportStatus = "draft" | "submitted" | "reviewing" | "approved" | "sent" | "revision_requested";
export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type SafetyCheckpointCode =
  | "pre_call"
  | "handoff_code"
  | "departure_confirmed"
  | "hospital_checkin"
  | "doctor_consult_update"
  | "pharmacy_payment"
  | "safe_return_close";

export type SafetyCheckpointStatus = "pending" | "completed" | "missed" | "skipped" | "escalated";

export type SafetyCheckpoint = {
  code: SafetyCheckpointCode;
  label: string;
  description: string;
  expectedAt: string;
  graceMinutes: number;
  requiredBy: "manager" | "parent" | "ops" | "system";
  status: SafetyCheckpointStatus;
  completedAt?: string;
  visibleToFamily: boolean;
  escalationOwner: string;
};

export type SafetyHandoff = {
  appointmentId: string;
  meetingCode: string;
  managerIdentityVerified: boolean;
  handoffVerified: boolean;
  parentConfirmed: boolean;
  managerConfirmed: boolean;
  safeReturnConfirmed: boolean;
  lastSafetyEvent: string;
  nextEscalationAt: string;
};

export type SafetyEscalation = {
  id: string;
  checkpointCode: SafetyCheckpointCode;
  severity: RiskSeverity;
  status: "open" | "acknowledged" | "backup_dispatched" | "resolved" | "false_alarm";
  trigger: string;
  owner: string;
  fallbackAction: string;
};

export type Appointment = {
  id: string;
  title: string;
  appointment_at: string;
  meet_at: string;
  meet_place: string;
  pickup_method: TransportMode;
  status: AppointmentStatus;
  meeting_code?: string;
  elderName?: string;
  hospitalName?: string;
};

export type ElderCareProfile = {
  elder_id: string;
  mobility_level: "unknown" | "independent" | "slow_walk" | "cane" | "wheelchair" | "needs_assist";
  communication_preference?: string;
  hearing_note?: string;
  vision_note?: string;
  cognitive_note?: string;
  medication_caution?: string;
  allergy_note?: string;
  fall_risk: boolean;
  preferred_call_name?: string;
  comfort_items: string[];
  important_notes?: string;
};

export type GuardianTask = {
  id: string;
  appointment_id: string;
  assigned_to?: string;
  title: string;
  description?: string;
  due_at?: string;
  status: TaskStatus;
  source: "manual" | "report" | "system" | "ops";
};

export type AppointmentMessage = {
  id: string;
  appointment_id: string;
  sender_id?: string;
  message: string;
  is_internal: boolean;
  visible_to_family: boolean;
  created_at: string;
};

export type PaymentOrder = {
  id: string;
  appointment_id: string;
  payer_id?: string;
  status: PaymentStatus;
  amount_krw: number;
  base_service_amount_krw: number;
  out_of_pocket_amount_krw: number;
  manager_vehicle_transport_amount_krw: 0;
};

export type ManagerTrustSummary = {
  id?: string;
  name: string;
  trustScore: number;
  approved: boolean;
  completedCount: number;
  ratingAverage: number;
  specialties: string[];
  regions: string[];
  hasVehicle: boolean;
  directTransportAllowed: boolean;
  transportModeLabel: string;
  verificationBadges: string[];
  lastBackgroundCheckAt?: string;
  reportQualityScore?: number;
  openRiskCount?: number;
};

export type AssignmentCandidate = ManagerTrustSummary & {
  available: boolean;
  distanceKm: number;
  specialtyMatch: number;
  regionMatch: boolean;
  scheduleConflict: boolean;
  riskPenalty: number;
  fitScore: number;
  recommendation: "auto_recommend" | "manual_review" | "do_not_assign";
  reason: string[];
};

export type TimelineTone = "safe" | "warn" | "danger" | "neutral";

export type TimelineItem = {
  time: string;
  title: string;
  description: string;
  status: string;
  tone?: TimelineTone;
};

export type CareReport = {
  visitSummary: string;
  doctorInstructions: string[];
  tests: string[];
  medications: string[];
  nextAppointment?: string;
  cost: string;
  parentCondition: string;
  guardianNextActions: string[];
  status: ReportStatus;
  reviewedBy?: string;
  qualityScore?: number;
};

export type RatingDimension = "safety" | "kindness" | "accuracy" | "punctuality";

export type RiskFlag = {
  id: string;
  severity: RiskSeverity;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  code: string;
  title: string;
  description: string;
  owner: string;
  due: string;
  playbook: string[];
};

export type OpsMetric = {
  label: string;
  value: string;
  helper: string;
  tone?: TimelineTone;
};

export type ConsentScope = {
  code: string;
  label: string;
  description: string;
  recommended: boolean;
  sensitive: boolean;
};

export const transportModeLabels: Record<TransportMode, string> = {
  hospital_front_meet: "병원 앞 만남",
  home_front_meet_taxi: "집 앞 만남 후 택시 동행",
  mobility_partner: "이동지원 제휴 연결",
  manager_vehicle_info_only: "매니저 차량 보유 정보 표시",
  direct_transport_partner: "직접 운송 제휴 서비스"
};

export const statusLabels: Record<AppointmentStatus, string> = {
  draft: "작성 중",
  requested: "요청 접수",
  manager_assigned: "매니저 배정",
  consent_pending: "동의 대기",
  confirmed: "확정",
  in_progress: "진행 중",
  completed: "동행 완료",
  reported: "리포트 작성",
  reviewed: "운영실 검수",
  cancelled: "취소"
};

export type PrepItemCategory = "document" | "medicine" | "mobility" | "payment" | "comfort" | "question" | "arrival";
export type PrepItemStatus = "ready" | "missing" | "optional" | "done";

export type AppointmentPrepItem = {
  id: string;
  category: PrepItemCategory;
  title: string;
  description: string;
  owner: string;
  due: string;
  status: PrepItemStatus;
  required: boolean;
  source: "family" | "manager" | "ops" | "system";
};

export type HospitalConvenienceGuide = {
  hospitalName: string;
  address: string;
  mainEntrance: string;
  checkinFloor: string;
  taxiDropoff: string;
  pickupReturnSpot: string;
  wheelchairDesk: string;
  restroomHint: string;
  pharmacyHint: string;
  parkingHint: string;
  estimatedStay: string;
  accessibilityTips: string[];
  managerTips: string[];
};

export type FamilyConvenienceAction = {
  id: string;
  title: string;
  description: string;
  owner: string;
  due: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  source: "report" | "appointment" | "family" | "system";
};

export type MedicationReminder = {
  id: string;
  name: string;
  dose: string;
  timing: string;
  checkTime: string;
  owner: string;
  status: "scheduled" | "confirmed" | "missed";
};

export type DocumentRequest = {
  id: string;
  title: string;
  reason: string;
  feeHint: string;
  requester: string;
  status: "needed" | "requested" | "received" | "not_needed";
  shareWithFamily: boolean;
  requiredConsentScope: string;
};

export type NextVisitSuggestion = {
  id: string;
  title: string;
  suggestedAt: string;
  reason: string;
  owner: string;
  status: "suggested" | "drafted" | "confirmed" | "dismissed";
};

export type ConvenienceMetric = {
  label: string;
  value: string;
  helper: string;
  tone?: TimelineTone;
};

export type WorryCategory =
  | "hospital"
  | "meal"
  | "medication"
  | "discharge"
  | "documents"
  | "regular_visit"
  | "lonely"
  | "emergency"
  | "unknown";

export type CareRequestUrgency = "today" | "soon" | "regular" | "unknown";
export type CareRequestChannel = "phone" | "kakao" | "photo" | "direct";
export type CareRequestStatus = "received" | "triaging" | "plan_ready" | "in_progress" | "resolved" | "cancelled";

export type WorryOption = {
  category: WorryCategory;
  icon: string;
  title: string;
  description: string;
  firstQuestion: string;
  outcome: string;
  tone?: TimelineTone;
};

export type CareRequest = {
  id: string;
  category: WorryCategory;
  title: string;
  summary: string;
  urgency: CareRequestUrgency;
  preferredChannel: CareRequestChannel;
  status: CareRequestStatus;
  elderName: string;
  createdAt: string;
  nextStep: string;
  notSure?: boolean;
};

export type CarePlanStep = {
  order: number;
  title: string;
  description: string;
  owner: "family" | "ops" | "manager" | "partner" | "system";
  status: TaskStatus | "ready" | "waiting";
  dueHint: string;
};

export type ReassuranceSignal = {
  label: string;
  value: string;
  helper: string;
  tone: TimelineTone;
};

export type CarePassportHighlight = {
  label: string;
  value: string;
  helper: string;
  visibility: "family" | "manager" | "ops";
};

export type MealCareOption = {
  title: string;
  description: string;
  suitableFor: string;
  actionLabel: string;
};

export type SocialCareProgram = {
  title: string;
  description: string;
  target: string;
  appAction: string;
};


export type CarePackCode =
  | "hospital_day"
  | "meal_subscription"
  | "medication_check"
  | "discharge_7days"
  | "documents_insurance"
  | "regular_visit"
  | "companionship_checkin"
  | "not_sure_consult";

export type CareServicePack = {
  code: CarePackCode;
  title: string;
  oneLine: string;
  whoNeedsIt: string;
  includes: string[];
  easyStart: string;
  reassuranceResult: string;
  socialValue?: string;
};

export type PlatformDifferentiator = {
  title: string;
  oldView: string;
  ourView: string;
  whyItMatters: string;
};

export type EasePrinciple = {
  label: string;
  rule: string;
  productCheck: string;
};

export type AssistedIntakeMode = {
  code: CareRequestChannel;
  title: string;
  description: string;
  bestFor: string;
  result: string;
};
