export const careRequestTypes = [
  {
    id: 'hospital',
    label: '병원동행',
    desc: '병원 예약, 접수, 이동, 보호자 리포트'
  },
  {
    id: 'medication',
    label: '복약확인',
    desc: '약 복용 여부 확인과 보호자 전달'
  },
  {
    id: 'meal',
    label: '식사확인',
    desc: '식사 여부와 식사 준비 상태 확인'
  },
  {
    id: 'life',
    label: '생활확인',
    desc: '집 안 상태, 귀가, 외출, 활동 확인'
  },
  {
    id: 'visit',
    label: '방문확인',
    desc: '응답 없음 또는 확인 필요 시 현장 확인'
  }
]

export const partnerVerificationStatuses = [
  { id: 'new', label: '신규' },
  { id: 'reviewing', label: '검토 중' },
  { id: 'approved', label: '승인' },
  { id: 'hold', label: '보류' },
  { id: 'rejected', label: '거절' },
  { id: 'active', label: '활동 중' },
  { id: 'paused', label: '정지' }
]

export function statusLabel(status: string) {
  return partnerVerificationStatuses.find((item) => item.id === status)?.label || status || '신규'
}

export function parsePartnerMemo(value: unknown) {
  if (typeof value !== 'string') return {}

  try {
    return JSON.parse(value)
  } catch {
    return { memo: value }
  }
}

export function partnerScore(partner: Record<string, unknown>, request: Record<string, unknown>) {
  const region = String(request.region || '').trim()
  const type = String(request.requestType || request.request_type || '').trim()
  const partnerRegion = String(partner.region || '').trim()

  let score = 0
  const reasons: string[] = []

  if (partner.verification_status === 'approved' || partner.verification_status === 'active') {
    score += 40
    reasons.push('운영실 승인 파트너')
  }

  if (region && partnerRegion && (partnerRegion.includes(region) || region.includes(partnerRegion))) {
    score += 30
    reasons.push('지역이 맞음')
  }

  if (type === 'hospital' && partner.can_hospital_accompany) {
    score += 20
    reasons.push('병원동행 가능')
  }

  if (type === 'medication' && partner.can_medication_check) {
    score += 20
    reasons.push('복약확인 가능')
  }

  if (type === 'meal' && partner.can_meal_check) {
    score += 20
    reasons.push('식사확인 가능')
  }

  if (partner.has_caregiver_license) {
    score += 10
    reasons.push('요양보호사 자격 있음')
  }

  if (partner.can_drive) {
    score += 5
    reasons.push('차량 이동 가능')
  }

  return {
    score,
    reasons
  }
}
