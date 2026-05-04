import type { CarePack, IntegrationConnector, PickupMode, WorryCategory } from './types'

export const pickupModeLabels: Record<PickupMode, string> = {
  hospital_front: '병원 앞 만남',
  home_taxi_together: '집 앞 만남 후 택시 동행',
  partner_mobility: '이동지원 제휴',
  family_dropoff: '가족이 모셔다드림'
}

export const vehiclePolicyText = {
  title: '차량 보유와 직접 운송은 다릅니다',
  body: '차량 보유 여부는 참고 정보입니다. 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다. 기본 이동은 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴 기준으로 운영합니다.',
  short: '차량 있음 = 직접 운송 가능이 아닙니다.'
}

export const worryLabels: Record<WorryCategory, string> = {
  hospital: '병원에 혼자 못 가세요',
  meal: '밥을 잘 못 챙겨 드세요',
  medication: '약을 잘 드시는지 모르겠어요',
  discharge: '퇴원 후 집에서 걱정돼요',
  documents: '보험서류가 필요해요',
  recurring: '정기진료를 계속 챙겨야 해요',
  not_sure: '뭘 해야 할지 모르겠어요',
  emergency: '긴급 확인 요청'
}

export const carePacks: CarePack[] = [
  { code: 'hospital_day', title: '병원 가는 날 안심팩', primaryWorry: 'hospital', description: '예약 확인, 만남 암호, 병원 동행, 진료 메모, 약국·서류, 귀가 확인까지 묶습니다.', included: ['사진/전화로 일정 접수', '매니저 신뢰카드', '만남 암호', '보호자 30초 요약', '가족 다음 할 일'], channels: ['phone', 'kakao', 'photo', 'simple_form'] },
  { code: 'meal_delivery', title: '안심밥상 케어', primaryWorry: 'meal', description: '식사 확인, 정기배송 상담, 퇴원 후 회복식, 저염식·연화식 메모를 연결합니다.', included: ['식사 확인 버튼', '정기 도시락/반찬 연결', '주간 식사 리포트', '공공·후원 식사 연결'], channels: ['phone', 'kakao', 'simple_form'], socialCareReady: true },
  { code: 'medication_check', title: '약 챙김 안심팩', primaryWorry: 'medication', description: '처방약 사진, 복용 시간, 먹었어요 확인, 미확인 알림을 연결합니다.', included: ['처방약 사진', '복용 시간표', '미확인 보호자 알림', '다음 진료 메모'], channels: ['photo', 'simple_form', 'phone'] },
  { code: 'discharge_7days', title: '퇴원 후 7일 안심팩', primaryWorry: 'discharge', description: '퇴원 직후 귀가, 약, 식사, 통증, 낙상, 다음 외래를 7일 동안 확인합니다.', included: ['귀가 동행', '복약 정리', '식사 확인', '통증/컨디션 체크', '7일 최종 리포트'], channels: ['phone', 'kakao', 'simple_form'] },
  { code: 'documents_insurance', title: '보험서류 챙김팩', primaryWorry: 'documents', description: '진료비 영수증, 세부내역서, 통원확인서, 처방전 사본을 빠뜨리지 않게 합니다.', included: ['필요 서류 추천', '서류 요청 체크', '비용 승인', '가족 제출 할 일'], channels: ['simple_form', 'phone'] },
  { code: 'regular_care', title: '정기진료·정기케어 자동관리', primaryWorry: 'recurring', description: '혈압, 당뇨, 재활, 안과, 치과 등 반복 진료와 안부 확인을 캘린더화합니다.', included: ['다음 예약 후보', '정기 안부', '같은 매니저 우선', '가족 역할 배분'], channels: ['phone', 'kakao', 'simple_form'] },
  { code: 'not_sure_consult', title: '뭘 해야 할지 모르겠어요 상담', primaryWorry: 'not_sure', description: '상황만 말하면 운영실이 걱정을 분류하고 케어팩 조합을 제안합니다.', included: ['상황 듣기', '걱정 분류', '케어패스포트 확인', '공공·후원 연결 검토'], channels: ['phone', 'kakao', 'photo'] }
]

export const integrations: IntegrationConnector[] = [
  { code: 'supabase', title: 'Supabase Auth·DB·RLS', purpose: '가족·부모님·매니저·운영실 권한 분리와 실제 데이터 저장', status: 'ready', envKeys: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] },
  { code: 'pwa', title: 'PWA 홈 화면 설치', purpose: '부모님 폰에서 큰 글씨 앱처럼 실행', status: 'ready', envKeys: [] },
  { code: 'vercel_cron', title: 'Vercel Cron 안전 점검', purpose: '지연·미확인 체크포인트를 주기적으로 운영실에 올림', status: 'ready', envKeys: ['CRON_SECRET'] },
  { code: 'kakao_alimtalk', title: '카카오 알림톡/채널 접수', purpose: '앱을 어려워하는 보호자에게 일정·리포트·식사 확인 알림', status: 'needs_key', envKeys: ['KAKAO_ALIMTALK_API_KEY', 'KAKAO_CHANNEL_ID'] },
  { code: 'google_maps', title: 'Google Maps 병원 동선', purpose: '택시 하차, 접수층, 휠체어 위치, 약국 동선을 매니저에게 제공', status: 'needs_key', envKeys: ['GOOGLE_MAPS_API_KEY'] },
  { code: 'serpapi', title: 'SerpApi 지역 검색 보조', purpose: '지역 식사배송·복지기관·약국 후보 탐색 보조', status: 'needs_key', envKeys: ['SERPAPI_API_KEY'] },
  { code: 'esign', title: '전자서명/동의', purpose: '민감정보 공유 범위, 병원동행 동의, 리포트 가족 공유 범위 기록', status: 'planned', envKeys: ['ESIGN_PROVIDER_SECRET'] },
  { code: 'payment', title: '결제/추가비용 승인', purpose: '예상 비용, 택시비, 서류 발급비, 식사 배송비 사전 승인', status: 'planned', envKeys: ['PAYMENT_PROVIDER_SECRET'] }
]
