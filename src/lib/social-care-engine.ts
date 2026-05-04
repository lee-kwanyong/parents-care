export type SocialNeedType =
  | 'cost_burden'
  | 'meal'
  | 'hospital'
  | 'medication'
  | 'documents'
  | 'post_discharge'
  | 'living_alone'
  | 'no_family_nearby'
  | 'wellbeing'
  | 'fall_risk'
  | 'emergency'
  | 'not_sure'

export type LivingSituation =
  | 'alone'
  | 'with_spouse'
  | 'with_family'
  | 'facility'
  | 'unknown'

export type SocialCaseStatus =
  | 'requested'
  | 'reviewing'
  | 'eligible'
  | 'voucher_issued'
  | 'connected'
  | 'not_eligible'
  | 'closed'
  | 'cancelled'

export type SocialUrgency = 'low' | 'normal' | 'high' | 'urgent'
export type SocialPriority = 'low' | 'normal' | 'high' | 'urgent'

export type SocialSupportCase = {
  id: string
  elder_name: string
  guardian_name: string | null
  guardian_phone: string | null
  need_types: SocialNeedType[]
  urgency: SocialUrgency
  living_situation: LivingSituation
  cost_burden: boolean
  meal_risk: boolean
  medication_risk: boolean
  post_discharge_risk: boolean
  no_family_nearby: boolean
  preferred_contact: 'phone' | 'kakao' | 'app' | 'ops'
  recommended_program_codes: string[]
  status: SocialCaseStatus
  priority: SocialPriority
  memo: string | null
  ops_memo: string | null
  reviewed_at: string | null
  connected_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export type SocialSupportProgram = {
  id: string
  program_code: string
  title: string
  description: string
  support_type: string
  target_need_types: SocialNeedType[]
  is_active: boolean
  requires_ops_review: boolean
  contact_method: string
  memo: string | null
  created_at: string
  updated_at: string
}

export type SupportVoucher = {
  id: string
  social_support_case_id: string | null
  elder_name: string
  voucher_code: string
  voucher_type: string
  title: string
  description: string | null
  value_label: string
  sponsor_name: string | null
  status: 'issued' | 'reserved' | 'used' | 'expired' | 'cancelled'
  issued_at: string
  used_at: string | null
  expires_at: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export const socialNeedOptions: Array<{
  code: SocialNeedType
  label: string
  description: string
}> = [
  {
    code: 'cost_burden',
    label: '비용이 부담돼요',
    description: '후원 쿠폰, 할인, 공공지원 연결 검토'
  },
  {
    code: 'meal',
    label: '식사를 못 챙겨 드세요',
    description: '도시락, 밑반찬, 회복식, 식사 지원 연결'
  },
  {
    code: 'hospital',
    label: '병원에 혼자 못 가세요',
    description: '공공 병원동행, 후원 동행, 운영실 상담'
  },
  {
    code: 'medication',
    label: '약을 못 챙기실까 걱정돼요',
    description: '복약 확인, 약 봉투 확인, 가족 할 일 연결'
  },
  {
    code: 'documents',
    label: '서류가 어려워요',
    description: '보험서류, 영수증, 통원확인서 챙김'
  },
  {
    code: 'post_discharge',
    label: '퇴원 후 집에서 걱정돼요',
    description: '퇴원 후 7일 안심팩, 회복식, 안부 확인'
  },
  {
    code: 'living_alone',
    label: '혼자 계세요',
    description: '정기 안부 확인, 식사·약 확인'
  },
  {
    code: 'no_family_nearby',
    label: '가까운 가족이 없어요',
    description: '운영실 확인, 지역기관 연결'
  },
  {
    code: 'wellbeing',
    label: '안부가 걱정돼요',
    description: '무료 안부 확인, 정기 확인'
  },
  {
    code: 'fall_risk',
    label: '넘어질까 걱정돼요',
    description: '낙상 위험, 이동 보조, 퇴원 후 확인'
  },
  {
    code: 'emergency',
    label: '긴급 도움이 필요해요',
    description: '운영실 우선 확인, 위험 시 119 안내'
  },
  {
    code: 'not_sure',
    label: '뭘 신청해야 할지 모르겠어요',
    description: '상황을 듣고 필요한 지원을 정리'
  }
]

export const livingSituationOptions: Array<{
  code: LivingSituation
  label: string
}> = [
  { code: 'alone', label: '혼자 사세요' },
  { code: 'with_spouse', label: '배우자와 사세요' },
  { code: 'with_family', label: '가족과 사세요' },
  { code: 'facility', label: '시설에 계세요' },
  { code: 'unknown', label: '잘 모르겠어요' }
]

export function normalizeNeedTypes(input: unknown): SocialNeedType[] {
  const raw = Array.isArray(input) ? input.map(String) : []
  const allowed = new Set(socialNeedOptions.map((item) => item.code))
  const result = raw.filter((item): item is SocialNeedType => allowed.has(item as SocialNeedType))
  return result.length > 0 ? Array.from(new Set(result)) : ['not_sure']
}

export function labelSocialNeed(type: string) {
  return socialNeedOptions.find((option) => option.code === type)?.label || type
}

export function labelLivingSituation(type: string) {
  return livingSituationOptions.find((option) => option.code === type)?.label || type
}

export function labelSocialCaseStatus(status: string) {
  const map: Record<string, string> = {
    requested: '요청됨',
    reviewing: '검토 중',
    eligible: '지원 가능',
    voucher_issued: '쿠폰 발급',
    connected: '연결 완료',
    not_eligible: '지원 어려움',
    closed: '종료',
    cancelled: '취소'
  }

  return map[status] || status
}

export function recommendSocialPrograms(input: {
  needTypes: SocialNeedType[]
  costBurden: boolean
  mealRisk: boolean
  postDischargeRisk: boolean
  noFamilyNearby: boolean
  livingSituation: LivingSituation
}) {
  const codes = new Set<string>()

  if (input.costBurden || input.needTypes.includes('cost_burden')) {
    codes.add('public_service_consult')
    codes.add('donation_care_voucher')
  }

  if (input.mealRisk || input.needTypes.includes('meal')) {
    codes.add('meal_support_referral')
  }

  if (input.postDischargeRisk || input.needTypes.includes('post_discharge')) {
    codes.add('post_discharge_support')
    codes.add('meal_support_referral')
  }

  if (
    input.noFamilyNearby ||
    input.livingSituation === 'alone' ||
    input.needTypes.includes('living_alone') ||
    input.needTypes.includes('wellbeing')
  ) {
    codes.add('free_check_call')
    codes.add('public_service_consult')
  }

  if (input.needTypes.includes('emergency')) {
    codes.add('emergency_support_review')
  }

  if (input.needTypes.includes('not_sure')) {
    codes.add('public_service_consult')
  }

  return Array.from(codes)
}

export function inferSocialPriority(input: {
  urgency: SocialUrgency
  needTypes: SocialNeedType[]
  costBurden: boolean
  mealRisk: boolean
  medicationRisk: boolean
  postDischargeRisk: boolean
  noFamilyNearby: boolean
}) {
  if (input.urgency === 'urgent' || input.needTypes.includes('emergency')) return 'urgent'
  if (input.mealRisk || input.medicationRisk || input.postDischargeRisk || input.noFamilyNearby) return 'high'
  if (input.costBurden) return 'high'
  return input.urgency
}

export function buildSocialSupportSummary(cases: SocialSupportCase[], vouchers: SupportVoucher[]) {
  const open = cases.filter((item) => !['closed', 'cancelled', 'not_eligible'].includes(item.status))
  const urgent = open.filter((item) => item.priority === 'urgent')
  const high = open.filter((item) => item.priority === 'high')
  const reviewing = open.filter((item) => item.status === 'reviewing' || item.status === 'requested')
  const connected = cases.filter((item) => item.status === 'connected')
  const issuedVouchers = vouchers.filter((item) => item.status === 'issued' || item.status === 'reserved')
  const usedVouchers = vouchers.filter((item) => item.status === 'used')

  const reassuranceState =
    urgent.length > 0
      ? '긴급'
      : high.length > 0 || reviewing.length > 0
        ? '확인 필요'
        : open.length > 0
          ? '확인 필요'
          : '안심'

  const familyNextActions: string[] = []

  if (urgent.length > 0) {
    familyNextActions.push('긴급 사회공헌 요청이 있습니다. 운영실 확인이 필요합니다.')
  }

  if (reviewing.length > 0) {
    familyNextActions.push('운영실이 공공지원·후원 연결 가능성을 검토 중입니다.')
  }

  if (issuedVouchers.length > 0) {
    familyNextActions.push('사용 가능한 후원 쿠폰이 있습니다.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('지금은 확인할 사회공헌 요청이 없습니다.')
  }

  return {
    reassuranceState,
    total: cases.length,
    open: open.length,
    urgent: urgent.length,
    high: high.length,
    reviewing: reviewing.length,
    connected: connected.length,
    issuedVoucher: issuedVouchers.length,
    usedVoucher: usedVouchers.length,
    familyNextActions: familyNextActions.slice(0, 3)
  }
}

export function makeVoucherCode() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `CARE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${suffix}`
}
