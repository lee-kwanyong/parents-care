export type ManagerVerificationType =
  | 'phone_identity'
  | 'id_document'
  | 'certificate_check'
  | 'career_check'
  | 'background_consent'
  | 'interview'
  | 'training'
  | 'cpr_training'
  | 'transport_policy'
  | 'digital_skill'
  | 'ops_reference'

export type ManagerVerificationProvider =
  | 'ops'
  | 'nice'
  | 'kcb'
  | 'kakao'
  | 'manual'
  | 'partner'

export type ManagerVerificationStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'waived'
  | 'expired'

export type CareManagerIdentityVerification = {
  id: string
  manager_application_id: string | null
  manager_profile_id: string | null
  applicant_name: string
  applicant_phone: string
  verification_type: ManagerVerificationType
  provider: ManagerVerificationProvider
  verification_status: ManagerVerificationStatus
  result_label: string | null
  provider_reference: string | null
  reviewer_name: string | null
  reviewer_role: 'ops' | 'system' | 'partner'
  verified_at: string | null
  expires_at: string | null
  ops_memo: string | null
  created_at: string
  updated_at: string
}

export type CareManagerEvaluation = {
  id: string
  manager_profile_id: string
  manager_assignment_id: string | null
  elder_name: string
  evaluator_name: string | null
  evaluator_phone: string | null
  rating_safety: number
  rating_kindness: number
  rating_accuracy: number
  rating_punctuality: number
  would_request_again: boolean
  public_comment: string | null
  private_comment: string | null
  evaluation_status: 'submitted' | 'ops_reviewed' | 'hidden' | 'deleted'
  created_by_role: 'family' | 'ops' | 'system'
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type ManagerTrustApplication = {
  id: string
  applicant_name: string
  applicant_phone: string
  application_status: string
  identity_verification_status: string
  matching_eligible: boolean
  vehicle_owned: boolean
  direct_transport_included: boolean
  understands_transport_policy: boolean
  privacy_agreement: boolean
  service_policy_agreement: boolean
  background_check_consent: boolean
  trust_level: string
  created_at: string
}

export type ManagerTrustProfile = {
  id: string
  application_id: string | null
  manager_name: string
  manager_phone: string
  profile_status: string
  trust_level: string
  identity_verified: boolean
  identity_verified_at: string | null
  vehicle_owned: boolean
  direct_transport_included: boolean
  trust_card_summary: string | null
  public_notes: string | null
  completed_cases: number
  evaluation_count: number
  rating_safety: number | null
  rating_kindness: number | null
  rating_accuracy: number | null
  rating_punctuality: number | null
  review_summary: string | null
  created_at: string
}

export const managerVerificationTypeOptions: Array<{
  code: ManagerVerificationType
  label: string
  description: string
  requiredBeforeMatching: boolean
}> = [
  {
    code: 'phone_identity',
    label: '휴대폰 본인확인',
    description: 'NICE/KCB/PASS 등 외부 본인확인 결과 또는 운영실 확인 결과',
    requiredBeforeMatching: true
  },
  {
    code: 'id_document',
    label: '신분 확인',
    description: '신분증 원본 저장이 아니라 확인 결과만 기록',
    requiredBeforeMatching: true
  },
  {
    code: 'transport_policy',
    label: '차량·이동 정책 확인',
    description: '차량 보유와 직접 유상운송 분리 원칙 확인',
    requiredBeforeMatching: true
  },
  {
    code: 'interview',
    label: '운영실 면접 확인',
    description: '말투, 태도, 현장 대응, 보호자 응대 기준 확인',
    requiredBeforeMatching: true
  },
  {
    code: 'certificate_check',
    label: '자격증 확인',
    description: '요양보호사, 사회복지사, 간호 관련 자격 등 확인',
    requiredBeforeMatching: false
  },
  {
    code: 'career_check',
    label: '경력 확인',
    description: '돌봄·병원동행·요양 관련 경력 확인',
    requiredBeforeMatching: false
  },
  {
    code: 'training',
    label: '교육 이수 확인',
    description: '부모님 케어 현장 기준 교육',
    requiredBeforeMatching: false
  },
  {
    code: 'cpr_training',
    label: 'CPR 교육 확인',
    description: '응급상황 대응 교육 확인',
    requiredBeforeMatching: false
  },
  {
    code: 'digital_skill',
    label: '디지털 활용 확인',
    description: '문자, 카톡, 지도앱, 택시앱, 상태 업데이트 가능 여부',
    requiredBeforeMatching: false
  },
  {
    code: 'ops_reference',
    label: '운영실 참고 확인',
    description: '기타 운영실 확인 기록',
    requiredBeforeMatching: false
  }
]

export function labelManagerVerificationType(type: string) {
  return managerVerificationTypeOptions.find((item) => item.code === type)?.label || type
}

export function labelManagerVerificationStatus(status: string) {
  const map: Record<string, string> = {
    pending: '대기',
    verified: '확인 완료',
    failed: '실패',
    waived: '면제',
    expired: '만료'
  }

  return map[status] || status
}

export function labelManagerTrustLevel(level: string) {
  const map: Record<string, string> = {
    review: '심사 중',
    basic: '기본 안심도',
    standard: '표준 안심도',
    trusted: '높은 안심도',
    hold: '보류'
  }

  return map[level] || level
}

export function buildManagerVerificationSummary(
  applications: ManagerTrustApplication[],
  verifications: CareManagerIdentityVerification[],
  profiles: ManagerTrustProfile[],
  evaluations: CareManagerEvaluation[]
) {
  const requiredTypes = managerVerificationTypeOptions
    .filter((item) => item.requiredBeforeMatching)
    .map((item) => item.code)

  const pendingApplications = applications.filter((application) => !application.matching_eligible)
  const eligibleApplications = applications.filter((application) => application.matching_eligible)
  const activeProfiles = profiles.filter((profile) => profile.profile_status === 'active')
  const unverifiedProfiles = profiles.filter((profile) => profile.profile_status === 'active' && !profile.identity_verified)
  const lowEvaluationProfiles = profiles.filter((profile) => {
    const safety = Number(profile.rating_safety || 0)
    const kindness = Number(profile.rating_kindness || 0)
    const accuracy = Number(profile.rating_accuracy || 0)
    const punctuality = Number(profile.rating_punctuality || 0)
    const average = (safety + kindness + accuracy + punctuality) / 4
    return profile.evaluation_count >= 3 && average > 0 && average < 3.5
  })

  const verifiedByApplication = new Map<string, Set<string>>()

  for (const verification of verifications) {
    if (!verification.manager_application_id) continue
    if (verification.verification_status !== 'verified') continue

    const current = verifiedByApplication.get(verification.manager_application_id) || new Set<string>()
    current.add(verification.verification_type)
    verifiedByApplication.set(verification.manager_application_id, current)
  }

  const missingRequiredTotal = applications.reduce((total, application) => {
    const verified = verifiedByApplication.get(application.id) || new Set<string>()
    const missing = requiredTypes.filter((type) => !verified.has(type))
    return total + missing.length
  }, 0)

  const reassuranceState =
    unverifiedProfiles.length > 0 || lowEvaluationProfiles.length > 0
      ? '긴급'
      : pendingApplications.length > 0 || missingRequiredTotal > 0
        ? '확인 필요'
        : '안심'

  const opsNextActions: string[] = []

  if (unverifiedProfiles.length > 0) {
    opsNextActions.push('본인확인 없이 활동 중인 매니저 프로필을 확인하세요.')
  }

  if (lowEvaluationProfiles.length > 0) {
    opsNextActions.push('평가 점수가 낮은 매니저를 검토하세요.')
  }

  if (pendingApplications.length > 0) {
    opsNextActions.push('매칭 전 필수 검증이 끝나지 않은 지원자를 확인하세요.')
  }

  if (missingRequiredTotal > 0) {
    opsNextActions.push('휴대폰 본인확인, 신분 확인, 차량정책, 면접 확인을 완료하세요.')
  }

  if (opsNextActions.length === 0) {
    opsNextActions.push('매니저 검증과 평가 구조가 안정적입니다.')
  }

  return {
    reassuranceState,
    applicationTotal: applications.length,
    pendingApplicationTotal: pendingApplications.length,
    eligibleApplicationTotal: eligibleApplications.length,
    verificationTotal: verifications.length,
    activeProfileTotal: activeProfiles.length,
    unverifiedProfileTotal: unverifiedProfiles.length,
    evaluationTotal: evaluations.length,
    lowEvaluationProfileTotal: lowEvaluationProfiles.length,
    opsNextActions: opsNextActions.slice(0, 4)
  }
}

export function formatRating(value: number | null | undefined) {
  if (!value) return '미평가'
  return value.toFixed(1)
}
