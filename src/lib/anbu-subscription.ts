export type AnbuPlanId = 'free' | 'basic' | 'plus'

export type AnbuPlan = {
  id: AnbuPlanId
  name: string
  priceLabel: string
  desc: string
  features: string[]
  cta: string
}

export const anbuPlans: AnbuPlan[] = [
  {
    id: 'free',
    name: '무료',
    priceLabel: '0원',
    desc: '부모님 안부온을 가볍게 시작하는 기본 플랜',
    features: [
      '부모님 연결코드 생성',
      '부모님 안부 버튼',
      '최근 안부 일부 확인',
      '기본 알림 발송함 저장'
    ],
    cta: '무료로 시작'
  },
  {
    id: 'basic',
    name: '안부온 베이직',
    priceLabel: '월 9,900원 예정',
    desc: '보호자가 매주 부모님 상태 변화를 리포트로 확인하는 플랜',
    features: [
      '주간 돌봄 리포트 전체 확인',
      '응답 없음 알림',
      '복약·식사 확인 필요 알림',
      '보호자 대시보드',
      '7일 무료 체험 가능'
    ],
    cta: '7일 체험 시작'
  },
  {
    id: 'plus',
    name: '안심케어 플러스',
    priceLabel: '월 29,900원 예정',
    desc: '운영실 확인과 케어파트너 연결까지 확장하는 플랜',
    features: [
      '베이직 전체 기능',
      '운영실 확인 요청',
      '케어파트너 연결 우선',
      '월간 리포트',
      '병원동행·생활확인 연결'
    ],
    cta: '상담 문의'
  }
]

function toString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function isSubscriptionUsable(row: Record<string, unknown> | null | undefined) {
  if (!row) return false

  const status = toString(row.status)
  const endedAt = toString(row.ended_at)

  if (!['trial', 'trialing', 'active', 'paid'].includes(status)) {
    return false
  }

  if (!endedAt) return true

  const endTime = new Date(endedAt).getTime()

  if (!Number.isFinite(endTime)) return true

  return endTime > Date.now()
}

export function normalizePlanName(row: Record<string, unknown> | null | undefined) {
  if (!row) return '무료'

  const planName = toString(row.plan_name)
  const status = toString(row.status)

  if (planName) return planName

  if (status === 'trial' || status === 'trialing') return '안부온 베이직 체험'

  return '무료'
}

export function subscriptionEndLabel(row: Record<string, unknown> | null | undefined) {
  if (!row) return ''

  const endedAt = toString(row.ended_at)

  if (!endedAt) return ''

  const date = new Date(endedAt)

  if (!Number.isFinite(date.getTime())) return ''

  return date.toLocaleString('ko-KR')
}
