export type ParentConsentSettings = {
  shareDailyCheck: boolean
  shareMeal: boolean
  shareMedication: boolean
  shareCondition: boolean
  shareHospitalSchedule: boolean
  shareCareReport: boolean
  shareLocation: boolean
  sharePhoto: boolean
}

export type ParentConsentActionType =
  | 'rest_today'
  | 'reply_later'
  | 'call_guardian'
  | 'help_needed'

export const defaultParentConsent: ParentConsentSettings = {
  shareDailyCheck: true,
  shareMeal: true,
  shareMedication: true,
  shareCondition: true,
  shareHospitalSchedule: true,
  shareCareReport: true,
  shareLocation: false,
  sharePhoto: false
}

export const parentConsentItems = [
  {
    key: 'shareDailyCheck',
    title: '오늘 안부 공유',
    desc: '괜찮아요, 나중에 답할게요 같은 기본 안부 응답을 자녀에게 보여줍니다.',
    recommended: true
  },
  {
    key: 'shareMeal',
    title: '식사 여부 공유',
    desc: '식사했어요, 아직 못 먹었어요 같은 식사 상태를 공유합니다.',
    recommended: true
  },
  {
    key: 'shareMedication',
    title: '복약 여부 공유',
    desc: '약 먹었어요, 약을 깜빡했어요 같은 복약 상태를 공유합니다.',
    recommended: true
  },
  {
    key: 'shareCondition',
    title: '몸 상태 공유',
    desc: '몸 괜찮아요, 몸이 불편해요 같은 상태를 공유합니다.',
    recommended: true
  },
  {
    key: 'shareHospitalSchedule',
    title: '병원 일정 공유',
    desc: '병원 예약, 검진일, 약국 방문 일정 확인 여부를 공유합니다.',
    recommended: true
  },
  {
    key: 'shareCareReport',
    title: '케어파트너 리포트 공유',
    desc: '방문확인이나 병원동행 리포트를 보호자에게 보여줍니다.',
    recommended: true
  },
  {
    key: 'shareLocation',
    title: '위치 공유',
    desc: '필요한 경우에만 위치 정보를 자녀와 공유합니다. 기본값은 꺼짐입니다.',
    recommended: false
  },
  {
    key: 'sharePhoto',
    title: '사진 공유',
    desc: '방문 리포트나 상태 확인에 필요한 사진 공유를 허용합니다. 기본값은 꺼짐입니다.',
    recommended: false
  }
] as const

export function normalizeConsent(input: Partial<ParentConsentSettings> | null | undefined) {
  return {
    ...defaultParentConsent,
    ...(input || {})
  }
}

export function consentActionLabel(actionType: string) {
  if (actionType === 'rest_today') return '오늘은 쉬고 싶어요'
  if (actionType === 'reply_later') return '나중에 답할게요'
  if (actionType === 'call_guardian') return '자녀에게 전화 요청'
  if (actionType === 'help_needed') return '도움이 필요해요'
  return actionType
}

export function consentActionRiskLevel(actionType: string) {
  if (actionType === 'help_needed') return 'high'
  if (actionType === 'call_guardian') return 'medium'
  if (actionType === 'reply_later') return 'low'
  if (actionType === 'rest_today') return 'low'
  return 'low'
}
