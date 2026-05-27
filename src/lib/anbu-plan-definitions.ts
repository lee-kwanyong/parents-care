export type AnbuPlanId = 'free' | 'basic' | 'family' | 'plus'

export type AnbuPlanDefinition = {
  id: AnbuPlanId
  name: string
  level: number
  displayPrice: string
  description: string
  limits: {
    dailyChecks: number
    guardians: number
    historyDays: number
    opsRequestsPerMonth: number
    weeklyReport: boolean
    routines: boolean
    partnerPriority: boolean
    assignments: boolean
  }
  features: string[]
}

export const anbuPlanDefinitions: Record<AnbuPlanId, AnbuPlanDefinition> = {
  free: {
    id: 'free',
    name: '무료 체험',
    level: 0,
    displayPrice: '0원',
    description: '부모님 안부온을 가볍게 시작하는 기본 플랜',
    limits: {
      dailyChecks: 1,
      guardians: 1,
      historyDays: 7,
      opsRequestsPerMonth: 0,
      weeklyReport: false,
      routines: false,
      partnerPriority: false,
      assignments: false
    },
    features: ['하루 1회 안부 체크', '보호자 1명 연결', '최근 7일 기록']
  },
  basic: {
    id: 'basic',
    name: '안부온 베이직',
    level: 1,
    displayPrice: '월 9,900원',
    description: '매일 식사·약·몸 상태를 확인하는 기본 구독',
    limits: {
      dailyChecks: 3,
      guardians: 2,
      historyDays: 30,
      opsRequestsPerMonth: 0,
      weeklyReport: true,
      routines: true,
      partnerPriority: false,
      assignments: false
    },
    features: ['하루 3회 안부 체크', '응답 없음 알림', '복약 알림', '주간 리포트']
  },
  family: {
    id: 'family',
    name: '안부온 패밀리',
    level: 2,
    displayPrice: '월 19,900원',
    description: '형제·자매가 함께 부모님 상태를 보는 가족형 플랜',
    limits: {
      dailyChecks: 5,
      guardians: 5,
      historyDays: 90,
      opsRequestsPerMonth: 0,
      weeklyReport: true,
      routines: true,
      partnerPriority: false,
      assignments: false
    },
    features: ['하루 5회 안부 체크', '보호자 5명 공유', '주간·월간 리포트', '병원 일정 알림']
  },
  plus: {
    id: 'plus',
    name: '안심케어 플러스',
    level: 3,
    displayPrice: '월 39,900원',
    description: '운영실 확인과 케어파트너 연결까지 포함하는 안심형',
    limits: {
      dailyChecks: 5,
      guardians: 5,
      historyDays: 365,
      opsRequestsPerMonth: 3,
      weeklyReport: true,
      routines: true,
      partnerPriority: true,
      assignments: true
    },
    features: ['운영실 확인 요청 월 3회', '케어파트너 우선 매칭', '월간 보호자 리포트', '배정 현황 확인']
  }
}

export function getAnbuPlanDefinition(planId?: string | null) {
  if (planId === 'basic' || planId === 'family' || planId === 'plus' || planId === 'free') {
    return anbuPlanDefinitions[planId]
  }

  return anbuPlanDefinitions.free
}

export function hasMinimumPlan(currentPlanId: string | null | undefined, requiredPlanId: AnbuPlanId) {
  const current = getAnbuPlanDefinition(currentPlanId)
  const required = getAnbuPlanDefinition(requiredPlanId)
  return current.level >= required.level
}
