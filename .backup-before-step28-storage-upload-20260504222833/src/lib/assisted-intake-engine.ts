export type AssistedIntakeChannel =
  | 'photo'
  | 'kakao'
  | 'sms'
  | 'phone'
  | 'text'
  | 'document'

export type AssistedIntakeStatus =
  | 'received'
  | 'triaged'
  | 'converted'
  | 'needs_more_info'
  | 'closed'
  | 'cancelled'

export type AssistedIntakePriority = 'low' | 'normal' | 'high' | 'urgent'
export type AssistedAssetKind = 'image' | 'text' | 'document' | 'other'

export type AssistedIntakeAssetInput = {
  assetKind: AssistedAssetKind
  fileName?: string
  mimeType?: string
  sizeBytes?: number
  textContent?: string
  dataUrl?: string | null
}

export type AssistedIntakeRequest = {
  id: string
  elder_name: string
  contact_name: string | null
  contact_phone: string | null
  intake_channel: AssistedIntakeChannel
  raw_text: string | null
  summary_title: string
  auto_detected_worry: string
  recommended_pack_code: string
  status: AssistedIntakeStatus
  priority: AssistedIntakePriority
  social_care_requested: boolean
  preferred_response_channel: 'phone' | 'kakao' | 'app' | 'ops'
  converted_care_intake_entry_id: string | null
  ops_memo: string | null
  created_at: string
  updated_at: string
}

export type AssistedIntakeAsset = {
  id: string
  assisted_intake_request_id: string
  asset_kind: AssistedAssetKind
  file_name: string | null
  mime_type: string | null
  size_bytes: number | null
  text_content: string | null
  data_url: string | null
  storage_path: string | null
  created_at: string
}

export type AssistedIntakeParseResult = {
  id: string
  assisted_intake_request_id: string
  parse_status: string
  extracted_text: string | null
  detected_worry: string
  recommended_pack_code: string
  family_questions: string[]
  ops_next_actions: string[]
  confidence_label: '낮음' | '보통' | '높음'
  created_at: string
}

export const assistedIntakeChannels: Array<{
  code: AssistedIntakeChannel
  label: string
  description: string
}> = [
  {
    code: 'photo',
    label: '사진으로 맡기기',
    description: '병원 예약증, 약 봉투, 영수증, 처방전 사진'
  },
  {
    code: 'kakao',
    label: '카톡 내용 붙여넣기',
    description: '가족 카톡, 병원 안내 카톡, 상담 내용'
  },
  {
    code: 'sms',
    label: '문자 캡처/붙여넣기',
    description: '병원 예약 문자, 검사 안내 문자'
  },
  {
    code: 'phone',
    label: '전화로 맡기기',
    description: '앱 입력이 어려울 때 운영실 전화 접수'
  },
  {
    code: 'text',
    label: '상황만 간단히 적기',
    description: '짧게 한 줄만 적어도 됩니다'
  },
  {
    code: 'document',
    label: '서류 사진으로 맡기기',
    description: '영수증, 세부내역서, 검사결과지'
  }
]

export function labelAssistedChannel(channel: string) {
  return assistedIntakeChannels.find((item) => item.code === channel)?.label || channel
}

export function labelAssistedStatus(status: string) {
  const map: Record<string, string> = {
    received: '접수됨',
    triaged: '정리됨',
    converted: '케어 요청 생성',
    needs_more_info: '추가정보 필요',
    closed: '완료',
    cancelled: '취소'
  }

  return map[status] || status
}

export function labelPackCode(packCode: string) {
  const map: Record<string, string> = {
    hospital_day: '병원 가는 날 안심팩',
    meal_delivery: '안심밥상 케어',
    medication_check: '약 챙김 안심팩',
    discharge_7days: '퇴원 후 7일 안심팩',
    documents_insurance: '보험서류 챙김팩',
    regular_care: '정기진료 자동관리',
    wellbeing_check: '정기 안부 확인',
    urgent_help: '긴급 확인 요청',
    not_sure_consult: '뭘 해야 할지 모르겠어요 상담'
  }

  return map[packCode] || packCode
}

export function inferAssistedIntake(input: {
  rawText?: string | null
  channel?: AssistedIntakeChannel
  fileNames?: string[]
  socialCareRequested?: boolean
}) {
  const text = `${input.rawText || ''} ${(input.fileNames || []).join(' ')}`.toLowerCase()

  let worry = 'not_sure'
  let packCode = 'not_sure_consult'
  let priority: AssistedIntakePriority = 'normal'
  let confidence: '낮음' | '보통' | '높음' = text.trim().length > 8 ? '보통' : '낮음'

  if (/(긴급|119|쓰러|도움|응급|연락 안|위험)/.test(text)) {
    worry = 'emergency'
    packCode = 'urgent_help'
    priority = 'urgent'
    confidence = '높음'
  } else if (/(퇴원|수술|회복|입원 후|퇴원 후|외래)/.test(text)) {
    worry = 'discharge'
    packCode = 'discharge_7days'
    priority = 'high'
    confidence = '높음'
  } else if (/(밥|식사|도시락|죽|반찬|저염|당뇨식|연화식|못 드|입맛)/.test(text)) {
    worry = 'meal'
    packCode = 'meal_delivery'
    priority = 'high'
    confidence = '높음'
  } else if (/(약|복용|처방|약봉투|혈압약|당뇨약)/.test(text)) {
    worry = 'medication'
    packCode = 'medication_check'
    priority = 'high'
    confidence = '높음'
  } else if (/(영수증|세부내역|처방전|통원확인|진단서|소견서|보험|실손|서류)/.test(text)) {
    worry = 'documents'
    packCode = 'documents_insurance'
    priority = 'high'
    confidence = '높음'
  } else if (/(정기|재진|다음 예약|예약|진료|검사|병원|외래|내원)/.test(text)) {
    worry = 'hospital'
    packCode = 'hospital_day'
    priority = 'normal'
    confidence = '보통'
  } else if (/(혼자|안부|계심|연락|외로|가족이 없음)/.test(text)) {
    worry = 'wellbeing'
    packCode = 'wellbeing_check'
    priority = 'normal'
    confidence = '보통'
  }

  if (input.socialCareRequested || /(비용|부담|지원|복지|후원|공공|무료|기초|차상위)/.test(text)) {
    priority = priority === 'urgent' ? 'urgent' : 'high'
  }

  const familyQuestions = buildFamilyQuestions(worry)
  const opsNextActions = buildOpsActions(worry, input.socialCareRequested)

  return {
    worry,
    packCode,
    priority,
    confidence,
    summaryTitle: buildSummaryTitle(worry, input.channel),
    familyQuestions,
    opsNextActions
  }
}

function buildSummaryTitle(worry: string, channel?: string) {
  const channelLabel = channel ? labelAssistedChannel(channel) : '간편 접수'

  const map: Record<string, string> = {
    hospital: '병원 일정 관련 간편 접수',
    meal: '식사 걱정 간편 접수',
    medication: '복약 확인 간편 접수',
    discharge: '퇴원 후 케어 간편 접수',
    documents: '서류·영수증 간편 접수',
    wellbeing: '안부 확인 간편 접수',
    emergency: '긴급 도움 간편 접수',
    not_sure: '부모님 걱정 간편 접수'
  }

  return `${map[worry] || map.not_sure} · ${channelLabel}`
}

function buildFamilyQuestions(worry: string) {
  const map: Record<string, string[]> = {
    hospital: ['예약일과 병원명이 맞나요?', '부모님 이동 방식은 정해졌나요?', '보험서류가 필요한가요?'],
    meal: ['최근 식사는 하루 몇 끼 드시나요?', '씹기 어려운 음식이 있나요?', '정기배송과 식사 확인 중 무엇이 필요하나요?'],
    medication: ['현재 복용 중인 약이 있나요?', '약 봉투 사진이 있나요?', '누가 복용 확인을 할까요?'],
    discharge: ['퇴원일은 언제인가요?', '식사와 약 복용이 가능한가요?', '다음 외래가 잡혀 있나요?'],
    documents: ['실손보험 청구용인가요?', '영수증과 세부내역서가 필요한가요?', '검사결과지도 필요한가요?'],
    wellbeing: ['혼자 계시는 시간이 많나요?', '일주일에 몇 번 확인하면 좋을까요?', '연락이 안 되면 누구에게 알려드릴까요?'],
    emergency: ['현재 위치가 어디인가요?', '부모님과 연락이 되나요?', '생명·신체 위험이면 119가 필요한가요?'],
    not_sure: ['병원·밥·약 중 어디가 가장 걱정되나요?', '오늘 바로 필요한 도움인가요?', '전화로 설명을 원하시나요?']
  }

  return (map[worry] || map.not_sure).slice(0, 3)
}

function buildOpsActions(worry: string, socialCareRequested?: boolean) {
  const base: Record<string, string[]> = {
    hospital: ['예약 정보 정리', '이동 방식 확인', '매니저 배정 필요 여부 확인'],
    meal: ['식사 위험도 확인', '안심밥상/회복식 필요 여부 확인', '식사 확인 주기 제안'],
    medication: ['복용약 사진 요청', '복용 시간 정리', '가족 확인 담당자 지정'],
    discharge: ['퇴원일 확인', '퇴원 후 7일 안심팩 후보 생성', '다음 외래 확인'],
    documents: ['필요 서류 추천', '영수증/세부내역서/처방전 확인', '가족 전달 방식 확인'],
    wellbeing: ['안부 확인 주기 설정', '응답 누락 기준 확인', '가족 연락 흐름 확인'],
    emergency: ['보호자 즉시 연락', '위험도 판단', '필요 시 119 안내'],
    not_sure: ['걱정 유형 분류', '질문 3개 이하로 정리', '케어팩 후보 제안']
  }

  const actions = [...(base[worry] || base.not_sure)]

  if (socialCareRequested) {
    actions.push('공공지원·후원 연결 가능성 확인')
  }

  return actions.slice(0, 4)
}

export function buildAssistedIntakeSummary(requests: AssistedIntakeRequest[]) {
  const open = requests.filter((item) => !['converted', 'closed', 'cancelled'].includes(item.status))
  const urgent = open.filter((item) => item.priority === 'urgent')
  const high = open.filter((item) => item.priority === 'high')
  const needsMoreInfo = open.filter((item) => item.status === 'needs_more_info')
  const converted = requests.filter((item) => item.status === 'converted')

  const reassuranceState =
    urgent.length > 0
      ? '긴급'
      : high.length > 0 || needsMoreInfo.length > 0 || open.length > 0
        ? '확인 필요'
        : '안심'

  const familyNextActions: string[] = []

  if (urgent.length > 0) {
    familyNextActions.push('긴급 접수가 있습니다. 운영실 확인이 필요합니다.')
  }

  if (needsMoreInfo.length > 0) {
    familyNextActions.push('운영실이 추가 정보를 요청한 접수가 있습니다.')
  }

  if (open.length > 0) {
    familyNextActions.push('사진·카톡·문자 접수가 운영실에서 정리 중입니다.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('지금은 정리 중인 간편 접수가 없습니다.')
  }

  return {
    reassuranceState,
    total: requests.length,
    open: open.length,
    urgent: urgent.length,
    high: high.length,
    needsMoreInfo: needsMoreInfo.length,
    converted: converted.length,
    familyNextActions: familyNextActions.slice(0, 3)
  }
}
