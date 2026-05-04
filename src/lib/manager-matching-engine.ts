export type ManagerMatchingRequestType =
  | 'hospital_visit'
  | 'meal_check'
  | 'discharge_check'
  | 'document_pickup'
  | 'wellbeing_check'
  | 'custom'

export type ManagerMatchingStatus =
  | 'requested'
  | 'candidate_generated'
  | 'matched'
  | 'assigned'
  | 'cancelled'
  | 'completed'

export type ManagerMatchingPriority = 'low' | 'normal' | 'high' | 'urgent'

export type ManagerMatchingRequest = {
  id: string
  elder_name: string
  guardian_name: string | null
  guardian_phone: string | null
  request_title: string
  request_type: ManagerMatchingRequestType
  region_text: string | null
  hospital_name: string | null
  appointment_date: string | null
  appointment_time: string | null
  meeting_location: string | null
  required_specialties: string[]
  required_service_scopes: string[]
  mobility_support_needed: boolean
  hearing_support_needed: boolean
  allergy_attention_needed: boolean
  medication_attention_needed: boolean
  transport_mode: string
  vehicle_required: boolean
  direct_transport_required: boolean
  priority: ManagerMatchingPriority
  matching_status: ManagerMatchingStatus
  selected_manager_profile_id: string | null
  manager_assignment_id: string | null
  ops_memo: string | null
  created_at: string
  updated_at: string
}

export type ManagerMatchingCandidate = {
  id: string
  matching_request_id: string
  manager_profile_id: string
  match_score: number
  score_reasons: string[]
  candidate_status: 'recommended' | 'selected' | 'rejected' | 'assigned'
  ops_memo: string | null
  created_at: string
  updated_at: string
}

export type VerifiedManagerProfile = {
  id: string
  manager_name: string
  manager_phone: string
  profile_status: string
  trust_level: string
  identity_verified: boolean
  available_regions: string[]
  specialties: string[]
  service_scopes: string[]
  vehicle_owned: boolean
  driving_license_owned: boolean
  direct_transport_included: boolean
  trust_card_summary: string | null
  public_notes: string | null
  evaluation_count: number
  rating_safety: number | null
  rating_kindness: number | null
  rating_accuracy: number | null
  rating_punctuality: number | null
  review_summary: string | null
  created_at: string
}

export const matchingRequestTypeOptions: Array<{
  code: ManagerMatchingRequestType
  label: string
  description: string
}> = [
  {
    code: 'hospital_visit',
    label: '병원동행',
    description: '접수, 진료, 약국, 서류, 귀가 확인'
  },
  {
    code: 'meal_check',
    label: '식사 확인',
    description: '식사 여부, 회복식, 안심밥상 확인'
  },
  {
    code: 'discharge_check',
    label: '퇴원 후 확인',
    description: '퇴원 후 약, 식사, 통증, 다음 외래 확인'
  },
  {
    code: 'document_pickup',
    label: '서류 수령',
    description: '영수증, 세부내역서, 처방전, 통원확인서 확인'
  },
  {
    code: 'wellbeing_check',
    label: '안부 확인',
    description: '부모님 상태와 연락 가능 여부 확인'
  },
  {
    code: 'custom',
    label: '기타',
    description: '운영실 직접 지정'
  }
]

export function labelMatchingRequestType(type: string) {
  return matchingRequestTypeOptions.find((item) => item.code === type)?.label || type
}

export function labelMatchingStatus(status: string) {
  const map: Record<string, string> = {
    requested: '요청됨',
    candidate_generated: '후보 생성',
    matched: '매칭 선택',
    assigned: '배정 완료',
    cancelled: '취소',
    completed: '완료'
  }

  return map[status] || status
}

export function labelTrustLevel(level: string) {
  const map: Record<string, string> = {
    basic: '기본 안심도',
    standard: '표준 안심도',
    trusted: '높은 안심도',
    hold: '보류'
  }

  return map[level] || level
}

function includesAny(source: string[] | null | undefined, targets: string[]) {
  const normalized = new Set((source || []).map((item) => item.toLowerCase()))
  return targets.some((target) => normalized.has(target.toLowerCase()))
}

function regionMatch(profileRegions: string[], regionText: string | null) {
  if (!regionText) return false
  const haystack = profileRegions.join(' ').toLowerCase()
  return regionText
    .split(/[,\s/]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .some((part) => haystack.includes(part) || part.includes(haystack))
}

export function scoreManagerCandidate(input: {
  profile: VerifiedManagerProfile
  regionText: string | null
  requiredSpecialties: string[]
  requiredServiceScopes: string[]
  mobilitySupportNeeded: boolean
  hearingSupportNeeded: boolean
  medicationAttentionNeeded: boolean
  vehicleRequired: boolean
}) {
  let score = 40
  const reasons: string[] = []

  if (input.profile.identity_verified) {
    score += 15
    reasons.push('본인확인 완료')
  }

  if (input.profile.trust_level === 'trusted') {
    score += 15
    reasons.push('높은 안심도')
  } else if (input.profile.trust_level === 'standard') {
    score += 10
    reasons.push('표준 안심도')
  } else {
    score += 5
    reasons.push('기본 안심도')
  }

  if (regionMatch(input.profile.available_regions || [], input.regionText)) {
    score += 15
    reasons.push('가능지역 일치')
  }

  if (includesAny(input.profile.specialties || [], input.requiredSpecialties)) {
    score += 10
    reasons.push('전문분야 일치')
  }

  if (includesAny(input.profile.service_scopes || [], input.requiredServiceScopes)) {
    score += 8
    reasons.push('업무범위 일치')
  }

  if (input.mobilitySupportNeeded && includesAny(input.profile.specialties || [], ['휠체어 이동 보조', '재활·물리치료'])) {
    score += 5
    reasons.push('이동 보조 경험')
  }

  if (input.hearingSupportNeeded && includesAny(input.profile.specialties || [], ['청력·의사소통 보조'])) {
    score += 5
    reasons.push('의사소통 보조 가능')
  }

  if (input.medicationAttentionNeeded && includesAny(input.profile.service_scopes || [], ['복약 확인', '약국 동행'])) {
    score += 5
    reasons.push('복약·약국 확인 가능')
  }

  if (input.vehicleRequired && input.profile.vehicle_owned) {
    score += 2
    reasons.push('차량 보유')
  }

  if (input.profile.direct_transport_included) {
    score -= 100
    reasons.push('직접 운송 포함 표시로 제외 필요')
  }

  if (!input.profile.identity_verified || input.profile.profile_status !== 'active' || input.profile.trust_level === 'hold') {
    score -= 100
    reasons.push('매칭 불가 상태')
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons
  }
}

export function buildManagerMatchingSummary(requests: ManagerMatchingRequest[], candidates: ManagerMatchingCandidate[], profiles: VerifiedManagerProfile[]) {
  const requested = requests.filter((item) => item.matching_status === 'requested')
  const candidateGenerated = requests.filter((item) => item.matching_status === 'candidate_generated')
  const matched = requests.filter((item) => item.matching_status === 'matched')
  const assigned = requests.filter((item) => item.matching_status === 'assigned')
  const verifiedProfiles = profiles.filter((item) => item.profile_status === 'active' && item.identity_verified && !item.direct_transport_included)

  const reassuranceState =
    verifiedProfiles.length === 0 || requested.length > 0 || candidateGenerated.length > 0 || matched.length > 0
      ? '확인 필요'
      : '안심'

  const opsNextActions: string[] = []

  if (verifiedProfiles.length === 0) {
    opsNextActions.push('본인확인 완료된 매니저 프로필이 필요합니다.')
  }

  if (requested.length > 0) {
    opsNextActions.push('매칭 요청의 후보를 생성하세요.')
  }

  if (candidateGenerated.length > 0) {
    opsNextActions.push('추천 후보 중 매니저를 선택하세요.')
  }

  if (matched.length > 0) {
    opsNextActions.push('선택된 매니저로 현장 배정을 생성하세요.')
  }

  if (opsNextActions.length === 0) {
    opsNextActions.push('매니저 매칭 상태가 안정적입니다.')
  }

  return {
    reassuranceState,
    requestTotal: requests.length,
    requestedTotal: requested.length,
    candidateGeneratedTotal: candidateGenerated.length,
    matchedTotal: matched.length,
    assignedTotal: assigned.length,
    candidateTotal: candidates.length,
    verifiedProfileTotal: verifiedProfiles.length,
    opsNextActions: opsNextActions.slice(0, 4)
  }
}
