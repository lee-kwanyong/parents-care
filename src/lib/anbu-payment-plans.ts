export type AnbuPaymentPlan = {
  id: string
  name: string
  orderName: string
  amount: number
  displayPrice: string
  billingCycle: 'free' | 'monthly' | 'one_time'
  planType: 'subscription' | 'care_fee' | 'free'
  description: string
  features: string[]
}

export const anbuPaymentPlans: AnbuPaymentPlan[] = [
  {
    id: 'free',
    name: '무료 체험',
    orderName: '안부웍스 무료 체험',
    amount: 0,
    displayPrice: '0원',
    billingCycle: 'free',
    planType: 'free',
    description: '부모님 안부온을 가볍게 시작하는 기본 플랜',
    features: ['하루 1회 안부 체크', '보호자 1명 연결', '최근 7일 기록 보기', '부모님 코드 연결']
  },
  {
    id: 'basic',
    name: '안부온 베이직',
    orderName: '안부온 베이직 월 구독',
    amount: 9900,
    displayPrice: '월 9,900원',
    billingCycle: 'monthly',
    planType: 'subscription',
    description: '매일 식사·약·몸 상태를 확인하는 기본 구독',
    features: ['하루 최대 3회 안부 체크', '복약 알림', '응답 없음 앱 알림', '보호자 2명', '주간 리포트']
  },
  {
    id: 'family',
    name: '안부온 패밀리',
    orderName: '안부온 패밀리 월 구독',
    amount: 19900,
    displayPrice: '월 19,900원',
    billingCycle: 'monthly',
    planType: 'subscription',
    description: '형제·자매가 함께 부모님 상태를 보는 가족형 플랜',
    features: ['하루 최대 5회 안부 체크', '보호자 최대 5명', '병원 일정 알림', '응답 없음 알림 강화', '주간·월간 리포트']
  },
  {
    id: 'plus',
    name: '안심케어 플러스',
    orderName: '안심케어 플러스 월 구독',
    amount: 39900,
    displayPrice: '월 39,900원',
    billingCycle: 'monthly',
    planType: 'subscription',
    description: 'AI 안부 확인에 운영실 확인 요청을 더한 안심형 플랜',
    features: ['안부온 패밀리 기능 포함', '운영실 확인 요청 월 3회 포함', '케어파트너 우선 매칭', '월간 보호자 리포트']
  },
  {
    id: 'ops_call',
    name: '운영실 전화 확인',
    orderName: '운영실 전화 확인 1회',
    amount: 9900,
    displayPrice: '1회 9,900원',
    billingCycle: 'one_time',
    planType: 'care_fee',
    description: '부모님 또는 보호자에게 전화로 상황을 확인합니다.',
    features: ['운영실 전화 확인', '보호자 안내', '간단 기록 남기기']
  },
  {
    id: 'life_check',
    name: '생활확인 케어',
    orderName: '생활확인 케어 1회',
    amount: 29000,
    displayPrice: '1회 29,000원부터',
    billingCycle: 'one_time',
    planType: 'care_fee',
    description: '식사, 약, 귀가, 생활상태를 케어파트너가 확인합니다.',
    features: ['식사 확인', '복약 여부 확인', '생활상태 기록', '보호자 리포트']
  },
  {
    id: 'hospital_basic',
    name: '병원동행 기본',
    orderName: '병원동행 기본 2시간',
    amount: 59000,
    displayPrice: '2시간 59,000원부터',
    billingCycle: 'one_time',
    planType: 'care_fee',
    description: '병원 접수, 대기, 약국, 귀가 확인을 도와드립니다.',
    features: ['병원 접수 보조', '진료 대기 동행', '약국 동행', '귀가 확인']
  }
]

export function getAnbuPaymentPlan(planId: string) {
  return anbuPaymentPlans.find((plan) => plan.id === planId) || null
}

export function formatWon(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export function createAnbuOrderId() {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `ANBU_${Date.now()}_${random}`
}

export function createCustomerKey() {
  const random = Math.random().toString(36).slice(2, 14)
  return `ANBU_CUSTOMER_${Date.now()}_${random}`
}
