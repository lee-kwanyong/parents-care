export const anbuRoutineTemplates = [
  {
    id: 'morning-meal',
    label: '아침 식사',
    time: '08:00',
    message: '아침 식사하셨어요?',
    channel: '앱 알림'
  },
  {
    id: 'morning-medication',
    label: '아침 약',
    time: '09:00',
    message: '아침 약 드셨어요?',
    channel: '앱 알림'
  },
  {
    id: 'lunch-meal',
    label: '점심 식사',
    time: '12:30',
    message: '점심 식사 확인해주세요.',
    channel: '앱 알림'
  },
  {
    id: 'evening-medication',
    label: '저녁 약',
    time: '19:00',
    message: '저녁 약 드셨나요?',
    channel: '앱 알림'
  },
  {
    id: 'night-check',
    label: '밤 안부',
    time: '20:30',
    message: '오늘 몸은 괜찮으셨어요?',
    channel: '앱 알림'
  }
]

export const notificationEscalationRules = [
  {
    title: '1차 부모님 재알림',
    desc: '정해진 시간 후 응답이 없으면 부모님께 한 번 더 부드럽게 알립니다.'
  },
  {
    title: '2차 보호자 알림',
    desc: '일정 시간 응답이 없으면 보호자에게 응답 없음 알림을 보냅니다.'
  },
  {
    title: '3차 운영실 확인',
    desc: '반복 미응답 또는 위험 신호가 있으면 운영실 확인 요청으로 전환합니다.'
  },
  {
    title: '4차 케어파트너 연결',
    desc: '보호자가 원하면 병원동행, 생활확인, 방문확인 파트너를 연결합니다.'
  }
]

export const anbuRiskRules = [
  { signal: '6시간 이상 응답 없음', score: 20 },
  { signal: '12시간 이상 응답 없음', score: 40 },
  { signal: '식사 못함', score: 20 },
  { signal: '약 깜빡함', score: 25 },
  { signal: '몸이 불편함', score: 30 },
  { signal: '외롭다·힘들다 반복', score: 15 },
  { signal: '병원 일정 미확인', score: 20 },
  { signal: '도움 요청', score: 50 }
]

export const weeklyReportSample = {
  title: '이번 주 부모님 안부 리포트',
  period: '최근 7일',
  stats: [
    { label: '식사 확인', value: '7일 중 6일 정상' },
    { label: '복약 확인', value: '21회 중 18회 확인' },
    { label: '몸 상태', value: '2회 불편함 응답' },
    { label: '기분', value: '외로움 응답 1회' },
    { label: '응답 없음', value: '2회' },
    { label: '병원 일정', value: '1건 완료' }
  ],
  aiSummary:
    '이번 주는 전반적으로 안정적이지만, 수요일과 금요일 점심 복약 확인이 누락되었습니다. 다음 주에는 점심 약 알림 시간을 조정하는 것이 좋습니다.',
  nextActions: [
    '점심 약 알림 시간을 12시 30분에서 13시로 조정',
    '몸이 불편하다고 응답한 날의 원인 확인',
    '다음 병원 예약 전날 보호자에게 재알림'
  ]
}

export const opsAnbuQueue = [
  {
    name: '어머니',
    state: '확인 필요',
    reason: '12시간 이상 응답 없음, 저녁 약 미확인',
    action: '보호자 전화 후 운영실 확인 요청'
  },
  {
    name: '아버지',
    state: '주의',
    reason: '점심 식사 미확인, 오늘 활동량 낮음',
    action: '부모님 재알림 발송'
  },
  {
    name: '부모님',
    state: '정상',
    reason: '식사·복약·몸 상태 모두 확인',
    action: '주간 리포트 자동 반영'
  }
]

export const partnerApplyFields = [
  '이름',
  '전화번호',
  '활동 지역',
  '가능 요일/시간',
  '요양보호사 자격 여부',
  '병원동행 가능 여부',
  '복약 확인 가능 여부',
  '식사 확인 가능 여부',
  '차량 이동 가능 여부',
  '자격증 사진',
  '신분증 확인',
  '희망 활동비'
]

export const partnerVettingSteps = [
  '본인 확인',
  '자격증 확인',
  '활동 가능 지역 확인',
  '보호자 응대 가능 여부 확인',
  '리포트 작성 가능 여부 확인',
  '운영실 승인'
]

export const privacyConsentItems = [
  '부모님 안부 정보 수집 동의',
  '자녀에게 안부 정보 제공 동의',
  '위치 정보 사용 동의',
  '앱 알림 수신 동의',
  '복약·병원 일정 등록 동의',
  '케어파트너에게 필요한 정보 공유 동의',
  '개인정보 보관 기간 동의',
  '동의 철회 기능 안내 확인'
]

export const pricingPlans = [
  {
    name: '무료',
    price: '0원',
    desc: '가볍게 시작하는 기본 안부 체크',
    features: ['하루 1회 안부 체크', '보호자 1명', '기본 알림', '최근 7일 기록']
  },
  {
    name: '안부온 베이직',
    price: '월 구독',
    desc: '매일 안부와 리포트를 받는 보호자용',
    features: ['하루 3회 안부 체크', '복약 알림', '응답 없음 알림', '보호자 2명 이상', '주간 리포트']
  },
  {
    name: '안심케어 플러스',
    price: '구독 + 사람 연결',
    desc: '운영실과 케어파트너까지 연결하는 안심형',
    features: ['운영실 확인 요청', '케어파트너 연결', '병원동행 신청', '생활확인 요청', '월간 리포트']
  }
]

export const platformRoadmap = [
  'AI 안부확인',
  '위험 신호 분류',
  '보호자 알림',
  '운영실 확인',
  '케어파트너 연결',
  '주간·월간 리포트'
]
