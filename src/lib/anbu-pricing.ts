export type AnbuBillingCycle = 'one_time' | 'monthly' | 'addon'
export type AnbuPlanCategory = 'subscription' | 'care' | 'report' | 'addon'

export type AnbuPricingPlan = {
  code: string
  badge: string
  title: string
  priceKrw: number
  priceLabel: string
  subPrice: string
  desc: string
  billingCycle: AnbuBillingCycle
  category: AnbuPlanCategory
  durationDays?: number
  partnerVisits?: number
  officeChecks?: number
  purchasable: boolean
  recommended?: boolean
  features: string[]
  metadata: Record<string, unknown>
}

export const ANBU_REFERRAL_POINT = 5000

export const ANBU_PRICING_PLANS: AnbuPricingPlan[] = [
  {
    code: 'monthly-report-9900',
    badge: '월 구독',
    title: '안부완료 리포트',
    priceKrw: 9900,
    priceLabel: '월 9,900원',
    subPrice: '부모님 1명 기준 · 방문 없음',
    desc: '가족이 직접 부모님 안부를 확인하고, 확인 결과를 기록해 안부완료 리포트로 남기는 기본 구독입니다.',
    billingCycle: 'monthly',
    category: 'subscription',
    purchasable: true,
    recommended: false,
    features: [
      '부모님 3버튼 안부 입력',
      '보호자 확인 사건함',
      '전화 확인 결과 기록',
      '안부완료 리포트 저장·공유',
      '주간 요약 리포트'
    ],
    metadata: {
      humanVisitIncluded: false,
      officeCheckIncluded: false,
      note: '요양보호사/생활확인 파트너 방문 비용 미포함'
    }
  },
  {
    code: 'two-week-care-299000',
    badge: '2주 케어',
    title: '퇴원 후 2주 안부케어',
    priceKrw: 299000,
    priceLabel: '299,000원',
    subPrice: '14일 · 생활확인 파트너 3회 포함',
    desc: '퇴원 직후 2주 동안 안부확인, 미응답 재확인, 보호자 확인 기록, 생활확인 파트너 확인, 종료 리포트를 제공하는 케어 상품입니다.',
    billingCycle: 'one_time',
    category: 'care',
    durationDays: 14,
    officeChecks: 5,
    partnerVisits: 3,
    purchasable: true,
    recommended: true,
    features: [
      '14일 안부 확인',
      '미응답 재확인',
      '운영실 확인',
      '생활확인 파트너 3회 포함',
      '14일 안부완료 리포트'
    ],
    metadata: {
      humanVisitIncluded: true,
      partnerVisitIncluded: 3,
      recommended: true
    }
  }
]

export const DEFAULT_PLAN_CODE = 'two-week-care-299000'

export function normalizedPlanCode(value: unknown) {
  const code = typeof value === 'string'
    ? value.replace(/[^\w-]/g, '').slice(0, 100).toLowerCase()
    : ''

  return ANBU_PRICING_PLANS.some((plan) => plan.code === code)
    ? code
    : DEFAULT_PLAN_CODE
}

export function getPricingPlan(value: unknown) {
  const code = normalizedPlanCode(value)
  return ANBU_PRICING_PLANS.find((plan) => plan.code === code) || ANBU_PRICING_PLANS[0]
}

export function purchasablePlans() {
  return ANBU_PRICING_PLANS.filter((plan) => plan.purchasable)
}

export function corePlans() {
  return ANBU_PRICING_PLANS
}

export function addonPlans() {
  return []
}
