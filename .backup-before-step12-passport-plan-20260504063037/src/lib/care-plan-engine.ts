export type WorryType =
  | 'hospital'
  | 'meal'
  | 'medication'
  | 'discharge'
  | 'documents'
  | 'recurring'
  | 'wellbeing'
  | 'emergency'
  | 'not_sure'

export type CareBundleCode =
  | 'hospital_day'
  | 'meal_delivery'
  | 'medication_check'
  | 'discharge_7days'
  | 'documents_insurance'
  | 'regular_care'
  | 'wellbeing_check'
  | 'urgent_help'
  | 'not_sure_consult'
  | 'cost_approval'
  | 'same_manager'
  | 'pre_call'
  | 'social_support'

export type SimpleCarePlan = {
  intakeId?: string
  reassuranceState: '안심' | '확인 필요' | '긴급'
  title: string
  oneMinuteSummary: string
  primaryActions: string[]
  familyQuestions: string[]
  careBundles: Array<{
    code: CareBundleCode
    title: string
    description: string
    visibleToFamily: boolean
  }>
  opsActions: string[]
  easyModeRules: string[]
  elderFriendlyCopy: string[]
  socialCareNote?: string
  nextContactScript: string
}

export type PlanInput = {
  intakeId?: string
  worry?: string | null
  packCode?: string | null
  memo?: string | null
  socialCareRequested?: boolean | null
}

export const allCarePacks = [
  {
    code: 'hospital_day',
    title: '병원 가는 날 안심팩',
    target: '병원에 혼자 못 가시는 부모님',
    includes: ['예약 확인', '준비물 체크', '병원동행', '진료 내용 정리', '약·서류·다음 예약 확인']
  },
  {
    code: 'meal_delivery',
    title: '안심밥상 케어',
    target: '식사를 잘 못 챙겨 드시는 부모님',
    includes: ['식사 확인', '죽·연화식·저염식 상담', '정기배송 연결', '주간 식사 리포트']
  },
  {
    code: 'medication_check',
    title: '약 챙김 안심팩',
    target: '약 복용 여부가 걱정되는 부모님',
    includes: ['처방약 사진', '복용 시간 정리', '먹었어요 확인', '미확인 알림']
  },
  {
    code: 'discharge_7days',
    title: '퇴원 후 7일 안심팩',
    target: '퇴원 직후 집에서의 회복이 걱정되는 부모님',
    includes: ['귀가 확인', '약 정리', '식사 확인', '통증·컨디션 체크', '다음 외래 확인']
  },
  {
    code: 'documents_insurance',
    title: '보험서류 챙김팩',
    target: '실손보험·영수증·처방전이 필요한 가족',
    includes: ['진료비 영수증', '세부내역서', '통원확인서', '처방전', '검사결과지']
  },
  {
    code: 'regular_care',
    title: '정기진료·정기케어 자동관리',
    target: '당뇨·혈압·재활 등 반복 진료가 있는 부모님',
    includes: ['다음 예약 후보', '가족 할 일', '정기 알림', '반복 리포트']
  },
  {
    code: 'wellbeing_check',
    title: '정기 안부 확인',
    target: '혼자 계시는 부모님',
    includes: ['식사 확인', '약 확인', '컨디션 확인', '응답 누락 알림']
  },
  {
    code: 'not_sure_consult',
    title: '뭘 해야 할지 모르겠어요 상담',
    target: '무슨 서비스를 신청해야 할지 모르는 보호자',
    includes: ['상황 듣기', '걱정 분류', '필요 케어팩 추천', '운영실 상담']
  }
] as const

function textIncludes(text: string, words: string[]) {
  return words.some((word) => text.includes(word))
}

export function inferPackCode(input: PlanInput): CareBundleCode {
  const pack = String(input.packCode || '')
  if (pack) return pack as CareBundleCode

  const worry = String(input.worry || 'not_sure')
  const memo = String(input.memo || '').toLowerCase()

  if (worry === 'emergency') return 'urgent_help'
  if (worry === 'hospital') return 'hospital_day'
  if (worry === 'meal') return 'meal_delivery'
  if (worry === 'medication') return 'medication_check'
  if (worry === 'discharge') return 'discharge_7days'
  if (worry === 'documents') return 'documents_insurance'
  if (worry === 'recurring') return 'regular_care'
  if (worry === 'wellbeing') return 'wellbeing_check'

  if (textIncludes(memo, ['밥', '식사', '도시락', '죽', '반찬', '못 드'])) return 'meal_delivery'
  if (textIncludes(memo, ['약', '처방', '복용'])) return 'medication_check'
  if (textIncludes(memo, ['퇴원', '수술', '회복'])) return 'discharge_7days'
  if (textIncludes(memo, ['보험', '서류', '영수증', '세부내역'])) return 'documents_insurance'
  if (textIncludes(memo, ['병원', '진료', '예약', '외래'])) return 'hospital_day'

  return 'not_sure_consult'
}

function bundle(code: CareBundleCode, visibleToFamily = true) {
  const found = allCarePacks.find((pack) => pack.code === code)
  if (found) {
    return {
      code,
      title: found.title,
      description: found.includes.join(' · '),
      visibleToFamily
    }
  }

  const fallback: Record<CareBundleCode, string> = {
    hospital_day: '병원 가는 날 안심팩',
    meal_delivery: '안심밥상 케어',
    medication_check: '약 챙김 안심팩',
    discharge_7days: '퇴원 후 7일 안심팩',
    documents_insurance: '보험서류 챙김팩',
    regular_care: '정기진료·정기케어 자동관리',
    wellbeing_check: '정기 안부 확인',
    urgent_help: '긴급 확인 요청',
    not_sure_consult: '뭘 해야 할지 모르겠어요 상담',
    cost_approval: '추가비용 사전승인',
    same_manager: '같은 매니저 우선 배정',
    pre_call: '사전 안심전화',
    social_support: '공공지원·후원 연결'
  }

  return {
    code,
    title: fallback[code],
    description: fallback[code],
    visibleToFamily
  }
}

function uniq<T>(items: T[]) {
  return Array.from(new Set(items))
}

export function buildSimpleCarePlan(input: PlanInput): SimpleCarePlan {
  const packCode = inferPackCode(input)
  const memo = String(input.memo || '')
  const socialCare = Boolean(input.socialCareRequested)
  const isUrgent = packCode === 'urgent_help'

  const careBundles = [bundle(packCode)]

  if (packCode === 'hospital_day') {
    careBundles.push(bundle('pre_call'), bundle('documents_insurance'), bundle('medication_check'), bundle('cost_approval'))
  }

  if (packCode === 'meal_delivery') {
    careBundles.push(bundle('wellbeing_check'), bundle('social_support', socialCare))
  }

  if (packCode === 'discharge_7days') {
    careBundles.push(bundle('meal_delivery'), bundle('medication_check'), bundle('regular_care'), bundle('wellbeing_check'))
  }

  if (packCode === 'not_sure_consult') {
    careBundles.push(bundle('hospital_day'), bundle('meal_delivery'), bundle('medication_check'), bundle('social_support', socialCare))
  }

  if (socialCare && !careBundles.some((item) => item.code === 'social_support')) {
    careBundles.push(bundle('social_support'))
  }

  const titleByPack: Record<CareBundleCode, string> = {
    hospital_day: '병원 가는 날 케어플랜',
    meal_delivery: '식사 걱정 해결 플랜',
    medication_check: '약 복용 확인 플랜',
    discharge_7days: '퇴원 후 7일 안심 플랜',
    documents_insurance: '보험서류 챙김 플랜',
    regular_care: '정기진료 자동관리 플랜',
    wellbeing_check: '정기 안부 확인 플랜',
    urgent_help: '긴급 확인 플랜',
    not_sure_consult: '걱정 정리 상담 플랜',
    cost_approval: '추가비용 승인 플랜',
    same_manager: '같은 매니저 우선 배정 플랜',
    pre_call: '사전 안심전화 플랜',
    social_support: '사회공헌 연결 플랜'
  }

  const baseActions: Record<CareBundleCode, string[]> = {
    hospital_day: ['예약 문자나 병원 정보를 확인합니다', '부모님 주의사항을 1줄로 남깁니다', '필요 서류를 선택합니다'],
    meal_delivery: ['최근 식사 상태를 확인합니다', '드시기 어려운 음식이나 질환식을 메모합니다', '정기배송 또는 식사 확인만 할지 정합니다'],
    medication_check: ['약 봉투 사진을 준비합니다', '복용 시간을 확인합니다', '누가 확인할지 정합니다'],
    discharge_7days: ['퇴원일과 귀가 시간을 확인합니다', '처방약과 식사 가능 여부를 확인합니다', '다음 외래 일정을 확인합니다'],
    documents_insurance: ['보험 청구 여부를 정합니다', '필요 서류를 모르면 추천받기를 선택합니다', '수령 후 보관 방법을 정합니다'],
    regular_care: ['반복 진료 주기를 확인합니다', '다음 예약 후보를 정합니다', '가족 담당자를 정합니다'],
    wellbeing_check: ['안부 확인 요일을 정합니다', '연락 안 될 때 연락받을 가족을 정합니다', '식사·약·컨디션 질문을 선택합니다'],
    urgent_help: ['지금 위치와 연락처를 확인합니다', '생명·신체 위험이면 즉시 119에 연락합니다', '운영실이 보호자에게 바로 연락합니다'],
    not_sure_consult: ['상황을 짧게 남깁니다', '사진이나 카톡 내용이 있으면 나중에 추가합니다', '운영실 답변 방식을 정합니다'],
    cost_approval: ['추가비용은 먼저 승인합니다'],
    same_manager: ['이전 매니저 선호 여부를 확인합니다'],
    pre_call: ['사전 안심전화 가능 시간을 정합니다'],
    social_support: ['공공지원·후원 연결 필요 여부를 확인합니다']
  }

  const questionsByPack: Record<CareBundleCode, string[]> = {
    hospital_day: ['예약일과 병원명이 맞나요?', '부모님이 혼자 이동 가능한가요?', '보험서류가 필요한가요?'],
    meal_delivery: ['최근 식사는 하루 몇 끼 드시나요?', '씹기 어렵거나 피해야 할 음식이 있나요?', '정기배송과 식사 확인 중 무엇이 더 필요하나요?'],
    medication_check: ['새로 받은 약이 있나요?', '아침·점심·저녁 중 어떤 약이 걱정되나요?', '확인할 가족은 누구인가요?'],
    discharge_7days: ['퇴원일은 언제인가요?', '집에서 식사와 약 복용이 가능한가요?', '다음 외래가 잡혀 있나요?'],
    documents_insurance: ['실손보험 청구용인가요?', '영수증과 세부내역서가 필요한가요?', '검사결과지도 필요한가요?'],
    regular_care: ['반복 진료 주기는 어떻게 되나요?', '선호 병원과 요일이 있나요?', '가족 담당자는 누구인가요?'],
    wellbeing_check: ['일주일에 몇 번 확인하면 좋을까요?', '연락이 안 되면 누구에게 알려드릴까요?', '식사·약·컨디션 중 제일 걱정되는 건 무엇인가요?'],
    urgent_help: ['현재 위치가 어디인가요?', '부모님과 연락이 되나요?', '119가 필요한 상황인가요?'],
    not_sure_consult: ['가장 걱정되는 일이 병원·밥·약 중 어디에 가깝나요?', '부모님은 혼자 계시나요?', '오늘 바로 필요한 도움인가요?'],
    cost_approval: ['예상 비용을 먼저 안내받을까요?'],
    same_manager: ['지난번 매니저를 다시 원하시나요?'],
    pre_call: ['부모님께 사전 안내전화를 드려도 될까요?'],
    social_support: ['비용 부담이 있어 공공지원 안내가 필요하신가요?']
  }

  const opsByPack: Record<CareBundleCode, string[]> = {
    hospital_day: ['차량 보유와 직접 운송 가능 여부를 분리 안내', '병원 일정과 만남 암호 확인', '매니저 배정 후보 확인', '서류/약/다음 예약 체크리스트 생성'],
    meal_delivery: ['식사 위험도 확인', '저염식·연화식·회복식 필요 여부 확인', '정기배송/공공 식사 지원 후보 확인', '식사 확인 주기 제안'],
    medication_check: ['처방약 사진 요청', '복용 시간 정리', '가족 확인 담당자 지정', '미확인 알림 기준 설정'],
    discharge_7days: ['퇴원 당일 귀가 방식 확인', '약·식사·통증·낙상 위험 체크 구성', '다음 외래 확인', '7일 리포트 예약'],
    documents_insurance: ['필요 서류 후보 추천', '병원 발급 가능 여부 확인', '서류 수령 체크', '가족 전달 방식 확인'],
    regular_care: ['진료 반복 주기 확인', '다음 예약 후보 생성', '가족 할 일 자동 생성', '정기 알림 설정'],
    wellbeing_check: ['안부 질문 3개 이하로 구성', '응답 누락 기준 설정', '긴급 연락 흐름 확인', '가족 요약 리포트 설정'],
    urgent_help: ['보호자 즉시 연락', '위험도 판단', '필요 시 119/지역기관 안내', '사고/운영 로그 기록'],
    not_sure_consult: ['걱정 유형 분류', '필수 질문 3개 이하로 정리', '케어팩 조합 제안', '비용 부담 여부 확인'],
    cost_approval: ['추가비용 사전승인 필요 여부 확인'],
    same_manager: ['이전 매니저 우선 배정 가능 여부 확인'],
    pre_call: ['사전 안심전화 스크립트 준비'],
    social_support: ['공공지원·후원 쿠폰·지역 복지 후보 확인']
  }

  const primaryActions = uniq([
    ...baseActions[packCode],
    ...(socialCare ? ['비용 부담이 있으면 공공지원 연결을 함께 확인합니다'] : [])
  ]).slice(0, 3)

  const familyQuestions = uniq(questionsByPack[packCode]).slice(0, 3)
  const opsActions = uniq([
    ...opsByPack[packCode],
    '보호자에게 질문은 3개 이하로만 보냅니다',
    '앱 사용이 어려우면 전화/카톡으로 안내합니다'
  ]).slice(0, 6)

  const summaryByPack: Record<CareBundleCode, string> = {
    hospital_day: '병원 가는 날 필요한 준비, 동행, 진료 후 약·서류·다음 예약을 한 번에 정리합니다.',
    meal_delivery: '부모님 식사 상태를 확인하고, 필요하면 안심밥상·정기배송·공공지원까지 연결합니다.',
    medication_check: '약을 받았는지, 언제 먹는지, 가족이 어떻게 확인할지 간단히 정리합니다.',
    discharge_7days: '퇴원 직후 7일 동안 약·식사·통증·다음 외래·귀가 안전을 확인합니다.',
    documents_insurance: '실손보험과 가족 확인에 필요한 서류를 빠뜨리지 않게 정리합니다.',
    regular_care: '반복되는 진료와 약·식사·안부 확인을 놓치지 않도록 자동관리합니다.',
    wellbeing_check: '혼자 계신 부모님의 식사, 약, 컨디션을 부담 없이 확인합니다.',
    urgent_help: '긴급 요청으로 분류하고 운영실이 우선 확인합니다.',
    not_sure_consult: '상황을 듣고 병원·밥·약·서류·퇴원 케어 중 필요한 조합으로 정리합니다.',
    cost_approval: '추가 비용이 생기면 먼저 보호자에게 승인받습니다.',
    same_manager: '가능하면 익숙한 매니저를 우선 배정합니다.',
    pre_call: '부모님이 낯설지 않도록 사전 안내전화를 준비합니다.',
    social_support: '비용 부담이 있으면 공공지원과 후원 연결을 함께 검토합니다.'
  }

  return {
    intakeId: input.intakeId,
    reassuranceState: isUrgent ? '긴급' : packCode === 'not_sure_consult' ? '확인 필요' : '안심',
    title: titleByPack[packCode],
    oneMinuteSummary: summaryByPack[packCode] || summaryByPack.not_sure_consult,
    primaryActions,
    familyQuestions,
    careBundles,
    opsActions,
    easyModeRules: [
      '첫 화면은 버튼 4개 이하로 유지',
      '보호자 질문은 한 번에 3개 이하',
      '전화·카톡·사진 접수를 항상 제공',
      '부모님 화면은 큰 글씨와 큰 버튼 중심',
      '추가비용은 보호자 승인 후 진행'
    ],
    elderFriendlyCopy: [
      '관리받는다는 표현 대신 도와드린다는 표현 사용',
      '부모님에게는 복잡한 메뉴를 보여주지 않음',
      '오늘 일정, 만나는 사람, 만남 암호, 자녀 전화만 강조'
    ],
    socialCareNote: socialCare
      ? '비용 부담이 표시되어 공공지원, 후원 쿠폰, 지역 복지 연결을 함께 검토합니다.'
      : undefined,
    nextContactScript:
      '안녕하세요. 부모님 케어 요청을 확인했습니다. 필요한 질문은 세 가지만 확인드리고, 바로 쉬운 케어플랜으로 정리해드리겠습니다.'
  }
}

export function parsePlanFromDescription(description?: string | null): SimpleCarePlan | null {
  if (!description) return null
  try {
    const parsed = JSON.parse(description)
    if (parsed && typeof parsed === 'object' && 'title' in parsed && 'primaryActions' in parsed) {
      return parsed as SimpleCarePlan
    }
  } catch {
    return null
  }
  return null
}
