
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

export type IntakeChannel = 'phone' | 'kakao' | 'photo' | 'simple_form'

export type CarePackRecommendation = {
  worry: WorryType
  packCode: string
  title: string
  oneLine: string
  steps: string[]
  familyNextActions: string[]
  opsChecklist: string[]
  socialCareHint?: string
}

export const worryOptions: Array<{
  code: WorryType
  label: string
  description: string
  emoji: string
}> = [
  {
    code: 'hospital',
    label: '병원에 혼자 못 가세요',
    description: '병원 예약, 동행, 접수, 진료 내용 정리까지 필요해요.',
    emoji: '🏥'
  },
  {
    code: 'meal',
    label: '밥을 잘 못 챙겨 드세요',
    description: '식사 확인, 도시락·죽·저염식·회복식 연결이 필요해요.',
    emoji: '🍱'
  },
  {
    code: 'medication',
    label: '약을 잘 드시는지 모르겠어요',
    description: '처방약 수령, 복용 시간, 먹었어요 확인이 필요해요.',
    emoji: '💊'
  },
  {
    code: 'discharge',
    label: '퇴원 후 집에서 걱정돼요',
    description: '귀가, 약 정리, 식사, 통증, 다음 외래 확인이 필요해요.',
    emoji: '🏠'
  },
  {
    code: 'documents',
    label: '보험서류가 필요해요',
    description: '영수증, 세부내역서, 처방전, 통원확인서를 챙겨야 해요.',
    emoji: '📄'
  },
  {
    code: 'recurring',
    label: '정기진료를 계속 챙겨야 해요',
    description: '혈압, 당뇨, 재활, 안과, 치과 같은 반복 진료를 관리해요.',
    emoji: '📅'
  },
  {
    code: 'wellbeing',
    label: '혼자 계신 게 걱정돼요',
    description: '정기 안부, 식사, 약, 생활 위험을 가볍게 확인해요.',
    emoji: '☎️'
  },
  {
    code: 'emergency',
    label: '긴급하게 도움이 필요해요',
    description: '운영실이 먼저 확인해야 하는 긴급 요청이에요.',
    emoji: '🚨'
  },
  {
    code: 'not_sure',
    label: '뭘 해야 할지 모르겠어요',
    description: '상황만 알려주시면 필요한 도움을 정리해드려요.',
    emoji: '🤝'
  }
]

export function recommendCarePack(worry: WorryType, memo?: string): CarePackRecommendation {
  const text = (memo || '').toLowerCase()

  if (worry === 'not_sure') {
    if (text.includes('밥') || text.includes('식사') || text.includes('도시락') || text.includes('죽')) {
      return recommendCarePack('meal', memo)
    }
    if (text.includes('약') || text.includes('복용') || text.includes('처방')) {
      return recommendCarePack('medication', memo)
    }
    if (text.includes('퇴원') || text.includes('수술') || text.includes('회복')) {
      return recommendCarePack('discharge', memo)
    }
    if (text.includes('서류') || text.includes('보험') || text.includes('영수증')) {
      return recommendCarePack('documents', memo)
    }
    if (text.includes('병원') || text.includes('진료') || text.includes('예약')) {
      return recommendCarePack('hospital', memo)
    }
  }

  const map: Record<WorryType, CarePackRecommendation> = {
    hospital: {
      worry,
      packCode: 'hospital_day',
      title: '병원 가는 날 안심팩',
      oneLine: '병원 전 준비, 당일 동행, 진료 후 약·서류·다음 예약까지 정리합니다.',
      steps: ['예약 정보 확인', '준비물 체크', '동행 방식 확인', '진료 내용 요약', '약·서류·다음 예약 정리'],
      familyNextActions: ['예약 문자나 사진 준비', '부모님 주의사항 메모', '필요 서류 선택'],
      opsChecklist: ['병원/진료과 확인', '이동 방식 정책 확인', '매니저 배정 가능 여부 확인', '만남 암호 생성'],
      socialCareHint: '비용 부담이 있으면 지역 공공 병원동행 또는 후원 쿠폰 연결을 검토합니다.'
    },
    meal: {
      worry,
      packCode: 'meal_delivery',
      title: '안심밥상 케어',
      oneLine: '식사 확인부터 정기 도시락·죽·저염식·회복식 연결까지 돕습니다.',
      steps: ['식사 상태 확인', '씹기/삼키기 어려움 확인', '질환별 식단 메모', '정기배송 후보 정리', '가족에게 식사 리포트 공유'],
      familyNextActions: ['선호 음식 확인', '피해야 할 음식 메모', '배송 가능 요일 선택'],
      opsChecklist: ['식사 위험도 확인', '연화식/저염식/당뇨식 필요 여부 확인', '제휴 배송 후보 확인', '공공 식사 지원 가능성 확인'],
      socialCareHint: '결식 우려가 있으면 공공 급식, 밑반찬, 후원 도시락 연결을 우선 검토합니다.'
    },
    medication: {
      worry,
      packCode: 'medication_check',
      title: '약 챙김 안심팩',
      oneLine: '처방약 수령, 복용법 정리, 먹었어요 확인을 가족에게 알려줍니다.',
      steps: ['처방약 사진 기록', '복용 시간 정리', '복용 확인 알림', '미확인 시 가족 알림'],
      familyNextActions: ['기존 복용약 사진 준비', '약 봉투 보관 위치 확인'],
      opsChecklist: ['처방약 수령 여부 확인', '복용 주기 확인', '중복 약 확인 필요 여부 표시']
    },
    discharge: {
      worry,
      packCode: 'discharge_7days',
      title: '퇴원 후 7일 안심팩',
      oneLine: '퇴원 직후 7일 동안 약, 식사, 통증, 다음 외래, 낙상 위험을 확인합니다.',
      steps: ['퇴원 당일 귀가 확인', '처방약 정리', '식사 가능 여부 확인', '통증/컨디션 체크', '다음 외래 확인', '7일 요약 리포트'],
      familyNextActions: ['퇴원일 확인', '집에 필요한 물품 확인', '다음 외래 일정 확인'],
      opsChecklist: ['퇴원 병원 확인', '회복식 필요 여부 확인', '방문/전화 체크 방식 선택', '낙상 위험 체크']
    },
    documents: {
      worry,
      packCode: 'documents_insurance',
      title: '보험서류 챙김팩',
      oneLine: '실손보험과 가족 확인에 필요한 영수증·세부내역서·처방전 등을 챙깁니다.',
      steps: ['필요 서류 추천', '병원 발급 가능 여부 확인', '수령 확인', '가족에게 정리'],
      familyNextActions: ['보험 청구 여부 선택', '필요 서류를 모르면 잘 모르겠어요로 접수'],
      opsChecklist: ['영수증', '세부내역서', '통원확인서', '처방전', '검사결과지 필요 여부 확인']
    },
    recurring: {
      worry,
      packCode: 'regular_care',
      title: '정기진료·정기케어 자동관리',
      oneLine: '반복되는 진료와 약·식사·안부 확인을 놓치지 않게 관리합니다.',
      steps: ['반복 주기 확인', '다음 예약 후보 생성', '가족 할 일 생성', '알림 예약'],
      familyNextActions: ['주요 병원/진료과 입력', '반복 주기 선택'],
      opsChecklist: ['정기성 판단', '진료 주기 확인', '가족 담당자 배정']
    },
    wellbeing: {
      worry,
      packCode: 'wellbeing_check',
      title: '정기 안부 확인',
      oneLine: '혼자 계신 부모님의 식사, 약, 컨디션, 생활 위험을 가볍게 확인합니다.',
      steps: ['안부 주기 선택', '식사/약/컨디션 질문 설정', '이상 신호 시 가족 알림'],
      familyNextActions: ['안부 확인 요일 선택', '긴급 연락처 확인'],
      opsChecklist: ['응답 누락 기준 설정', '긴급 연락 흐름 확인']
    },
    emergency: {
      worry,
      packCode: 'urgent_help',
      title: '긴급 확인 요청',
      oneLine: '운영실이 즉시 확인해야 하는 요청으로 분류합니다.',
      steps: ['긴급 내용 확인', '보호자 연락', '필요 시 119/지역기관 안내', '운영 로그 기록'],
      familyNextActions: ['현재 위치와 연락 가능 번호 입력', '생명·신체 위험이면 즉시 119'],
      opsChecklist: ['긴급도 판단', '보호자 즉시 연락', '공공 긴급지원 안내', '운영 로그 기록']
    },
    not_sure: {
      worry,
      packCode: 'not_sure_consult',
      title: '뭘 해야 할지 모르겠어요 상담',
      oneLine: '상황만 듣고 병원, 식사, 약, 서류, 퇴원 케어 중 필요한 조합으로 정리합니다.',
      steps: ['상황 듣기', '걱정 분류', '필요 케어팩 추천', '가족에게 쉬운 선택지 제안'],
      familyNextActions: ['걱정되는 상황을 짧게 적기', '사진이나 카톡 내용이 있으면 나중에 추가'],
      opsChecklist: ['걱정 유형 분류', '필수 질문 3개 이하로 정리', '케어팩 후보 제안']
    }
  }

  return map[worry] || map.not_sure
}

export function normalizeWorry(input: unknown): WorryType {
  const value = typeof input === 'string' ? input : 'not_sure'
  return worryOptions.some((option) => option.code === value) ? (value as WorryType) : 'not_sure'
}

export function normalizeChannel(input: unknown): IntakeChannel {
  const value = typeof input === 'string' ? input : 'phone'
  if (value === 'phone' || value === 'kakao' || value === 'photo' || value === 'simple_form') return value
  return 'phone'
}
