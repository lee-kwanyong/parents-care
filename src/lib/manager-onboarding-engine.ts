export type ManagerApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'document_review'
  | 'interview_scheduled'
  | 'training_pending'
  | 'approved'
  | 'waitlisted'
  | 'rejected'
  | 'suspended'

export type ManagerType =
  | 'hospital_companion'
  | 'meal_check'
  | 'discharge_check'
  | 'document_helper'
  | 'wellbeing_check'
  | 'multi_care'

export type ManagerTrustLevel = 'review' | 'basic' | 'standard' | 'trusted' | 'hold'

export type CareManagerApplication = {
  id: string
  applicant_name: string
  applicant_phone: string
  birth_year: number | null
  address_text: string | null
  preferred_contact: 'phone' | 'kakao' | 'app' | 'email'
  application_status: ManagerApplicationStatus
  manager_type: ManagerType
  certifications: string[]
  career_years: number
  career_summary: string | null
  available_regions: string[]
  available_days: string[]
  available_time_slots: string[]
  specialties: string[]
  service_scopes: string[]
  digital_skills: string[]
  vehicle_owned: boolean
  driving_license_owned: boolean
  understands_transport_policy: boolean
  direct_transport_included: boolean
  cpr_certified: boolean
  background_check_consent: boolean
  privacy_agreement: boolean
  service_policy_agreement: boolean
  intro_text: string | null
  motivation_text: string | null
  review_score: number | null
  trust_level: ManagerTrustLevel
  ops_memo: string | null
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  approved_at: string | null
  rejected_at: string | null
  created_at: string
  updated_at: string
}

export type CareManagerProfile = {
  id: string
  application_id: string | null
  manager_name: string
  manager_phone: string
  profile_status: 'active' | 'paused' | 'suspended' | 'archived'
  trust_level: 'basic' | 'standard' | 'trusted' | 'hold'
  certifications: string[]
  available_regions: string[]
  specialties: string[]
  service_scopes: string[]
  vehicle_owned: boolean
  driving_license_owned: boolean
  direct_transport_included: boolean
  trust_card_summary: string | null
  public_notes: string | null
  completed_cases: number
  rating_safety: number | null
  rating_kindness: number | null
  rating_accuracy: number | null
  rating_punctuality: number | null
  approved_at: string
  created_at: string
  updated_at: string
}

export type CareManagerScreeningEvent = {
  id: string
  manager_application_id: string | null
  manager_profile_id: string | null
  event_type: string
  title: string
  description: string | null
  actor_role: 'applicant' | 'ops' | 'system'
  created_at: string
}

export const managerTypeOptions: Array<{
  code: ManagerType
  label: string
  description: string
}> = [
  {
    code: 'hospital_companion',
    label: '병원동행 매니저',
    description: '접수, 진료, 약국, 서류, 귀가 확인'
  },
  {
    code: 'meal_check',
    label: '식사 확인 매니저',
    description: '식사 여부, 회복식, 안심밥상 확인'
  },
  {
    code: 'discharge_check',
    label: '퇴원 후 확인 매니저',
    description: '퇴원 후 7일, 약, 식사, 낙상 위험 확인'
  },
  {
    code: 'document_helper',
    label: '서류 도움 매니저',
    description: '영수증, 세부내역서, 처방전, 통원확인서 확인'
  },
  {
    code: 'wellbeing_check',
    label: '안부 확인 매니저',
    description: '전화·방문 전 안부와 컨디션 확인'
  },
  {
    code: 'multi_care',
    label: '통합 케어 매니저',
    description: '병원, 식사, 약, 서류, 퇴원 후 케어 통합 수행'
  }
]

export const certificationOptions = [
  '요양보호사',
  '사회복지사',
  '간호사',
  '간호조무사',
  '장애인활동지원사',
  '병원동행매니저 교육 수료',
  '심폐소생술 교육 이수',
  '치매 관련 교육 수료',
  '기타 돌봄 관련 자격'
]

export const specialtyOptions = [
  '정형외과',
  '내과',
  '안과',
  '치과',
  '재활·물리치료',
  '건강검진',
  '퇴원 후 케어',
  '약국·복약 확인',
  '서류·보험서류',
  '식사·안부 확인',
  '휠체어 이동 보조',
  '청력·의사소통 보조'
]

export const serviceScopeOptions = [
  '병원 앞 만남',
  '집 앞 만남 후 택시 동행',
  '접수·수납 도움',
  '진료실 동행',
  '약국 동행',
  '서류 수령',
  '보호자 질문 전달',
  '30초 리포트 작성',
  '식사 확인',
  '복약 확인',
  '귀가 확인'
]

export const digitalSkillOptions = [
  '스마트폰 문자 가능',
  '카카오톡 가능',
  '지도앱 사용 가능',
  '택시앱 호출 가능',
  '병원 키오스크 도움 가능',
  '사진 촬영·업로드 가능',
  '앱에서 상태 업데이트 가능'
]

export const dayOptions = ['월', '화', '수', '목', '금', '토', '일']
export const timeSlotOptions = ['오전', '오후', '저녁', '종일', '협의 가능']

export function labelManagerType(type: string) {
  return managerTypeOptions.find((item) => item.code === type)?.label || type
}

export function labelApplicationStatus(status: string) {
  const map: Record<string, string> = {
    draft: '초안',
    submitted: '지원 접수',
    document_review: '서류 검토',
    interview_scheduled: '면접 예정',
    training_pending: '교육 확인',
    approved: '승인 완료',
    waitlisted: '대기 등록',
    rejected: '반려',
    suspended: '중지'
  }

  return map[status] || status
}

export function labelTrustLevel(level: string) {
  const map: Record<string, string> = {
    review: '심사 중',
    basic: '기본 안심도',
    standard: '표준 안심도',
    trusted: '높은 안심도',
    hold: '보류'
  }

  return map[level] || level
}

export function buildManagerTrustSummary(input: {
  certifications: string[]
  regions: string[]
  specialties: string[]
  vehicleOwned: boolean
  directTransportIncluded: boolean
}) {
  const certText = input.certifications.length > 0 ? input.certifications.slice(0, 3).join(', ') : '자격 확인 예정'
  const regionText = input.regions.length > 0 ? input.regions.slice(0, 4).join(', ') : '가능지역 확인 예정'
  const specialtyText = input.specialties.length > 0 ? input.specialties.slice(0, 3).join(', ') : '전문분야 확인 예정'
  const vehicleText = input.vehicleOwned ? '차량 보유' : '차량 미보유 또는 미입력'
  const transportText = input.directTransportIncluded
    ? '직접 운송 포함'
    : '개인차량 직접 유상운송은 기본 서비스에 포함되지 않음'

  return `${certText} · ${regionText} · ${specialtyText} · ${vehicleText} · ${transportText}`
}

export function buildManagerOnboardingSummary(applications: CareManagerApplication[], profiles: CareManagerProfile[]) {
  const waitingReview = applications.filter((item) => ['submitted', 'document_review'].includes(item.application_status))
  const interview = applications.filter((item) => item.application_status === 'interview_scheduled')
  const training = applications.filter((item) => item.application_status === 'training_pending')
  const approved = applications.filter((item) => item.application_status === 'approved')
  const activeProfiles = profiles.filter((item) => item.profile_status === 'active')
  const policyMissing = applications.filter((item) => !item.understands_transport_policy || !item.privacy_agreement || !item.service_policy_agreement)

  const reassuranceState =
    policyMissing.length > 0 || waitingReview.length > 0
      ? '확인 필요'
      : activeProfiles.length > 0
        ? '안심'
        : '확인 필요'

  const opsNextActions: string[] = []

  if (policyMissing.length > 0) {
    opsNextActions.push('차량·개인정보·서비스 정책 동의가 빠진 지원자를 확인하세요.')
  }

  if (waitingReview.length > 0) {
    opsNextActions.push('신규 지원자의 서류와 가능지역을 검토하세요.')
  }

  if (interview.length > 0) {
    opsNextActions.push('면접 예정 지원자의 일정과 결과를 확인하세요.')
  }

  if (training.length > 0) {
    opsNextActions.push('교육·CPR 이수 확인이 필요한 지원자가 있습니다.')
  }

  if (opsNextActions.length === 0) {
    opsNextActions.push('매니저 등록 상태가 안정적입니다.')
  }

  return {
    reassuranceState,
    applicationTotal: applications.length,
    waitingReviewTotal: waitingReview.length,
    interviewTotal: interview.length,
    trainingTotal: training.length,
    approvedTotal: approved.length,
    activeProfileTotal: activeProfiles.length,
    policyMissingTotal: policyMissing.length,
    opsNextActions: opsNextActions.slice(0, 3)
  }
}
