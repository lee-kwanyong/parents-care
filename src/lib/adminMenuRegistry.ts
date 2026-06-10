export type PortalRole = 'all' | 'parent' | 'child' | 'careWorker' | 'ops'

export type MenuLink = {
  href: string
  title: string
  description: string
  category: string
  roles: PortalRole[]
  badge?: string
  priority: number
  opsOnly?: boolean
}

export const roleMeta: Record<PortalRole, { title: string; shortTitle: string; description: string }> = {
  "all": {
    "title": "필수 통합 운영 메뉴",
    "shortTitle": "전체",
    "description": "실제 운영에 필요한 필수 메뉴를 다시 포함했습니다."
  },
  "parent": {
    "title": "부모님 필수 메뉴",
    "shortTitle": "부모님",
    "description": "부모님이 안부 신호를 입력하고 접속하는 필수 화면입니다."
  },
  "child": {
    "title": "자녀·보호자 필수 메뉴",
    "shortTitle": "자녀",
    "description": "부모님 상태, 리포트, 후속조치를 확인하는 필수 화면입니다."
  },
  "careWorker": {
    "title": "요양보호사·케어파트너 필수 메뉴",
    "shortTitle": "도움망",
    "description": "요청 수락과 처리 완료에 필요한 필수 화면입니다."
  },
  "ops": {
    "title": "운영실 필수 메뉴",
    "shortTitle": "운영실",
    "description": "자동운영, 도움망, 알림, 후속조치, 지자체 제출을 위한 필수 화면입니다."
  }
} as Record<PortalRole, { title: string; shortTitle: string; description: string }>

export const menuLinks: MenuLink[] = [
  {
    "href": "/",
    "title": "안부웍스 홈",
    "description": "부모님의 몸 상태와 도움 요청을 보호자 알림, 방문확인, 병원동행, 안심 리포트로 연결합니다.",
    "category": "공통 필수",
    "roles": [
      "all",
      "parent",
      "child",
      "provider",
      "ops"
    ],
    "badge": "홈",
    "priority": 1,
    "opsOnly": false
  },
  {
    "href": "/portal/ops",
    "title": "운영실 한눈 홈",
    "description": "실증 시작, 문자 자동화, 알림 발송, 긴급 요청, 리포트 저장까지 운영 순서대로 안내합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "홈",
    "priority": 1,
    "opsOnly": true
  },
  {
    "href": "/mobile",
    "title": "안부웍스 앱",
    "description": "부모님, 보호자, 요양보호사·돌봄파트너가 사용하는 설치형 모바일 앱 홈입니다.",
    "category": "공통",
    "roles": [
      "all",
      "parent",
      "child",
      "careWorker",
      "ops"
    ],
    "badge": "앱",
    "priority": 2,
    "opsOnly": false
  },
  {
    "href": "/menu",
    "title": "통합 메뉴",
    "description": "역할별 핵심 화면으로 이동합니다.",
    "category": "공통",
    "roles": [
      "all",
      "parent",
      "child",
      "careWorker",
      "ops"
    ],
    "badge": "메뉴",
    "priority": 2,
    "opsOnly": false
  },
  {
    "href": "/onboarding",
    "title": "가입 후 시작하기",
    "description": "보호자, 부모님, 생활확인 파트너, 운영실 역할별로 다음 3단계를 안내합니다.",
    "category": "공통 필수",
    "roles": [
      "all",
      "parent",
      "child",
      "provider",
      "ops"
    ],
    "badge": "시작",
    "priority": 2,
    "opsOnly": false
  },
  {
    "href": "/admin-menu",
    "title": "전체 통합 메뉴",
    "description": "운영에 필요한 핵심 화면과 개발자 경로를 관리합니다.",
    "category": "공통",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "전체",
    "priority": 3,
    "opsOnly": true
  },
  {
    "href": "/portal",
    "title": "역할별 시작 화면",
    "description": "역할을 선택하면 지금 눌러야 할 버튼만 순서대로 보여줍니다.",
    "category": "공통 필수",
    "roles": [
      "all",
      "parent",
      "child",
      "provider",
      "ops"
    ],
    "badge": "시작",
    "priority": 3,
    "opsOnly": false
  },
  {
    "href": "/login",
    "title": "로그인·회원가입",
    "description": "보호자 회원가입과 로그인을 시작합니다.",
    "category": "공통",
    "roles": [
      "all",
      "child"
    ],
    "badge": "로그인",
    "priority": 4,
    "opsOnly": false
  },
  {
    "href": "/auth/role",
    "title": "회원가입 역할 선택",
    "description": "로그인한 사용자의 보호자, 부모님, 생활확인 파트너, 운영실 역할을 저장합니다.",
    "category": "공통 필수",
    "roles": [
      "all",
      "parent",
      "child",
      "provider",
      "ops"
    ],
    "badge": "역할",
    "priority": 4,
    "opsOnly": false
  },
  {
    "href": "/proposal",
    "title": "외부 제안 랜딩",
    "description": "지자체·기관 담당자가 로그인 없이 볼 수 있는 공개 제안 페이지입니다.",
    "category": "공통",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "제안",
    "priority": 5,
    "opsOnly": false
  },
  {
    "href": "/auth/redirect",
    "title": "로그인 후 자동 이동",
    "description": "저장된 역할에 따라 보호자 리포트, 부모님 앱, 파트너 요청함, 운영실로 이동합니다.",
    "category": "공통 필수",
    "roles": [
      "all",
      "parent",
      "child",
      "provider",
      "ops"
    ],
    "badge": "이동",
    "priority": 5,
    "opsOnly": false
  },
  {
    "href": "/response/about",
    "title": "안부웍스 서비스 소개",
    "description": "비의료 생활확인 기반 부모님 안심관리 서비스 소개 페이지입니다.",
    "category": "공통 필수",
    "roles": [
      "all",
      "parent",
      "child",
      "provider",
      "ops"
    ],
    "badge": "소개",
    "priority": 6,
    "opsOnly": false
  },
  {
    "href": "/consent",
    "title": "실증 참여 동의서",
    "description": "안부웍스 자체 예비실증 참여 전 개인정보 수집, 비의료 고지, 응급상황 안내를 확인합니다.",
    "category": "공통 필수",
    "roles": [
      "all",
      "parent",
      "child",
      "provider",
      "ops"
    ],
    "badge": "동의",
    "priority": 7,
    "opsOnly": false
  },
  {
    "href": "/mobile/parent",
    "title": "부모님 5버튼 안부 앱",
    "description": "괜찮아요, 밥, 약, 몸 상태, 도움 요청을 큰 버튼으로 보냅니다.",
    "category": "부모님 필수",
    "roles": [
      "all",
      "parent",
      "ops"
    ],
    "badge": "5버튼",
    "priority": 11,
    "opsOnly": false
  },
  {
    "href": "/portal/child",
    "title": "자녀·보호자 페이지",
    "description": "부모님 상태와 후속조치를 확인하는 화면 모음입니다.",
    "category": "역할별 시작",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 11,
    "opsOnly": false
  },
  {
    "href": "/portal/parent",
    "title": "부모님 페이지",
    "description": "부모님이 오늘 안부 신호를 보내는 단순 화면입니다.",
    "category": "부모님 필수",
    "roles": [
      "all",
      "parent",
      "ops"
    ],
    "badge": "안부",
    "priority": 12,
    "opsOnly": false
  },
  {
    "href": "/portal/care-worker",
    "title": "요양보호사·케어파트너 페이지",
    "description": "지역 도움망이 요청을 수락하고 완료하는 화면 모음입니다.",
    "category": "역할별 시작",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "도움망",
    "priority": 12,
    "opsOnly": false
  },
  {
    "href": "/parent",
    "title": "부모님 안부 입력",
    "description": "식사, 복약, 몸 상태, 도움 요청 신호를 남깁니다.",
    "category": "부모님 필수",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "안부",
    "priority": 20,
    "opsOnly": false
  },
  {
    "href": "/parent/today",
    "title": "오늘 안부 체크",
    "description": "오늘 식사, 복약, 몸 상태를 확인합니다.",
    "category": "부모님 필수",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "체크",
    "priority": 21,
    "opsOnly": false
  },
  {
    "href": "/ops/users",
    "title": "가입자·실증 참여자 관리센터",
    "description": "회원가입, 역할, 부모님 연결, 안부 신호, 문자 발송 전환을 한 화면에서 확인합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "유저",
    "priority": 21,
    "opsOnly": true
  },
  {
    "href": "/ops/report-tracking",
    "title": "보호자 리포트 조회 추적센터",
    "description": "리포트 화면 진입, 가족코드 조회 성공/실패, 부모님 앱 링크 복사 이벤트를 추적합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "리포트",
    "priority": 22,
    "opsOnly": true
  },
  {
    "href": "/guardian/today",
    "title": "오늘 부모님 리포트",
    "description": "가족코드와 휴대폰 뒤 4자리로 오늘 부모님 안부 신호, 문자 기록, 다음 할 일을 확인합니다.",
    "category": "자녀·보호자 필수",
    "roles": [
      "all",
      "child",
      "ops"
    ],
    "badge": "리포트",
    "priority": 22,
    "opsOnly": false
  },
  {
    "href": "/ops/no-response",
    "title": "미응답 자동 처리센터",
    "description": "오늘 안부 신호가 없는 가구를 찾아 보호자 확인 문자와 대리입력을 유도합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "미응답",
    "priority": 23,
    "opsOnly": true
  },
  {
    "href": "/child/dashboard",
    "title": "보호자 대시보드",
    "description": "오늘 부모님 상태와 보호자 문자 기록을 한 화면에서 확인합니다.",
    "category": "자녀·보호자 필수",
    "roles": [
      "all",
      "child",
      "ops"
    ],
    "badge": "리포트",
    "priority": 23,
    "opsOnly": false
  },
  {
    "href": "/ops/pilot-report",
    "title": "실증 리포트 자동 생성센터",
    "description": "가입자, 실증 가구, 안부 신호, 문자, 리포트 조회, 유저스푼 결과를 외부 미팅용 리포트로 정리합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "리포트",
    "priority": 24,
    "opsOnly": true
  },
  {
    "href": "/guardian/proxy-checkin",
    "title": "보호자 대리 안부 기록",
    "description": "부모님이 앱을 누르지 못했을 때 보호자가 전화 확인 후 대신 기록합니다.",
    "category": "자녀·보호자 필수",
    "roles": [
      "all",
      "child",
      "ops"
    ],
    "badge": "대리입력",
    "priority": 24,
    "opsOnly": false
  },
  {
    "href": "/ops/proposal-reality-check",
    "title": "제안서 표현 현실화 센터",
    "description": "현재 기능, 예비실증, 기관실증, 장기 B2G/IoT 비전을 구분해 외부 제안 표현 리스크를 낮춥니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "표현",
    "priority": 25,
    "opsOnly": true
  },
  {
    "href": "/ops/consent-risk-center",
    "title": "개인정보·동의·책임범위 센터",
    "description": "실증 참여 동의, 비의료 고지, 개인정보 수집 범위, 생활확인 파트너 책임범위를 관리합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "동의",
    "priority": 26,
    "opsOnly": true
  },
  {
    "href": "/family-link",
    "title": "부모님 연결코드",
    "description": "보호자가 부모님과 연결할 6자리 코드를 만듭니다.",
    "category": "자녀·보호자 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "연결",
    "priority": 30,
    "opsOnly": false
  },
  {
    "href": "/mobile/guardian",
    "title": "자녀·보호자 앱",
    "description": "보호자가 부모님 상태와 후속조치 화면으로 이동합니다.",
    "category": "자녀·보호자 필수",
    "roles": [
      "all",
      "child",
      "ops"
    ],
    "badge": "앱",
    "priority": 31,
    "opsOnly": false
  },
  {
    "href": "/response",
    "title": "보호자 후속조치",
    "description": "부모님 신호에 대한 후속조치를 보호자 기준으로 확인합니다.",
    "category": "자녀·보호자 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "후속조치",
    "priority": 32,
    "opsOnly": false
  },
  {
    "href": "/family/actions",
    "title": "가족 실행 보드",
    "description": "가족이 맡은 실행 요청을 확인하고 처리합니다.",
    "category": "자녀·보호자 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "가족",
    "priority": 33,
    "opsOnly": false
  },
  {
    "href": "/family/invite",
    "title": "다른 가족 초대",
    "description": "다른 가족을 보호자 그룹에 초대합니다.",
    "category": "자녀·보호자 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "초대",
    "priority": 35,
    "opsOnly": false
  },
  {
    "href": "/provider/requests",
    "title": "지역 도움망 요청함",
    "description": "요양보호사, 케어파트너, 상점, 약국이 받은 요청을 수락하고 완료합니다.",
    "category": "요양보호사·케어파트너 필수",
    "roles": [
      "all",
      "careWorker",
      "ops"
    ],
    "badge": "요청함",
    "priority": 40,
    "opsOnly": false
  },
  {
    "href": "/ops/notification-safety",
    "title": "문자 안전정리센터",
    "description": "테스트 문자, 과거 실패 문자, 실증 문자를 분리하고 재시도 위험을 정리합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "안전",
    "priority": 45,
    "opsOnly": true
  },
  {
    "href": "/ops/proxy-checkin",
    "title": "운영실 대리 안부 기록",
    "description": "운영실이 전화 확인 후 부모님 안부 상태를 대신 기록합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "대리입력",
    "priority": 46,
    "opsOnly": true
  },
  {
    "href": "/ops/message-automation",
    "title": "상황별 문자 자동화센터",
    "description": "부모님 신호, 긴급 요청, 수락, 완료, 문자 실패 상황에 따라 자동 문자 문구를 선택하고 발송합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "문자",
    "priority": 47,
    "opsOnly": true
  },
  {
    "href": "/ops/private-pilot",
    "title": "자체 예비 실증 관리센터",
    "description": "지자체 실증 전 5~10가구 규모로 먼저 작게 돌려 실제 작동 증거를 만듭니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "실증",
    "priority": 48,
    "opsOnly": true
  },
  {
    "href": "/ops/households",
    "title": "실증 대상자 관리",
    "description": "관리 대상자, 가족코드, 보호자, 권역, 위험군, 동의 상태를 관리합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "대상자",
    "priority": 49,
    "opsOnly": true
  },
  {
    "href": "/ops/preflight-test",
    "title": "실증 전 전체 기능 테스트",
    "description": "모바일 앱, 운영실 API, DB, 요양보호사 즉시 배치, 토큰 수락, 상태 머신을 자동 점검합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "TEST",
    "priority": 49,
    "opsOnly": true
  },
  {
    "href": "/ops/control-center",
    "title": "운영실 자동운영 상태판",
    "description": "Heartbeat, 오토파일럿, 긴급 사건, 문자, 요양보호사 가용 상태를 한 화면에서 확인합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "상태판",
    "priority": 50,
    "opsOnly": true
  },
  {
    "href": "/ops",
    "title": "운영실 홈",
    "description": "운영실에서 필요한 모든 관리 화면으로 이동합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "홈",
    "priority": 50,
    "opsOnly": true
  },
  {
    "href": "/ops/security-center",
    "title": "RLS·권한 점검센터",
    "description": "사건, 문자, 개인정보, 요양보호사 배치 데이터의 공개 접근 여부를 점검합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "보안",
    "priority": 51,
    "opsOnly": true
  },
  {
    "href": "/ops/autopilot",
    "title": "운영실 오토파일럿",
    "description": "부모님 신호별 플레이북으로 다음 조치를 추천하고 실행합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "오토파일럿",
    "priority": 51,
    "opsOnly": true
  },
  {
    "href": "/ops/urgent-dispatch",
    "title": "요양보호사 즉시 배치센터",
    "description": "갑자기 도움이 필요한 어르신에게 가까운 요양보호사·돌봄파트너를 즉시 배치합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "즉시배치",
    "priority": 52,
    "opsOnly": true
  },
  {
    "href": "/ops/heartbeat",
    "title": "운영실 자동운영 Heartbeat",
    "description": "오토파일럿, 에스컬레이션, 문자 대기열을 주기적으로 점검합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "Heartbeat",
    "priority": 52,
    "opsOnly": true
  },
  {
    "href": "/ops/state-machine",
    "title": "긴급 사건 상태 머신",
    "description": "긴급 사건의 중복 수락, 만료 링크, 오래된 미수락 사건, 완료 후 재배치를 점검합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "상태",
    "priority": 53,
    "opsOnly": true
  },
  {
    "href": "/ops/network",
    "title": "도움망 네트워크",
    "description": "돌봄파트너, 요양보호사, 지역상점, 약국, 수행기관을 등록·관리합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "도움망",
    "priority": 53,
    "opsOnly": true
  },
  {
    "href": "/ops/pilot-qa",
    "title": "실증 QA·시연 스크립트",
    "description": "지자체 실증 전 필수 점검과 15분 시연 순서를 관리합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "QA",
    "priority": 54,
    "opsOnly": true
  },
  {
    "href": "/ops/notification-dispatch",
    "title": "알림 발송센터",
    "description": "문자 초안을 선택해 SMS를 대기열에 넣거나 바로 발송합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "문자",
    "priority": 54,
    "opsOnly": true
  },
  {
    "href": "/ops/one-page-proposal",
    "title": "1페이지 실증 제안서",
    "description": "지자체 담당자에게 보낼 한 장짜리 실증 협업 제안서를 편집하고 저장합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "제안서",
    "priority": 55,
    "opsOnly": true
  },
  {
    "href": "/ops/notification-cleanup",
    "title": "알림 기록 정리센터",
    "description": "테스트 문자, 실패 기록, 오래된 대기 알림, 발송 완료 기록을 운영 화면에서 분리합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "정리",
    "priority": 55,
    "opsOnly": true
  },
  {
    "href": "/response?scope=ops",
    "title": "운영실 후속조치 관제",
    "description": "전체 후속조치 요청을 보고 지역 도움망으로 전파합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "관제",
    "priority": 55,
    "opsOnly": true
  },
  {
    "href": "/ops/response-escalation",
    "title": "자동 에스컬레이션",
    "description": "미수락·미완료 요청을 수동 연결 필요 상태로 승격합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "승격",
    "priority": 56,
    "opsOnly": true
  },
  {
    "href": "/ops/incidents",
    "title": "사건 타임라인",
    "description": "신호, 문자, 도움망, 수락, 통화, 배정, 완료 기록을 사건별로 통합합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "타임라인",
    "priority": 57,
    "opsOnly": true
  },
  {
    "href": "/ops/admin-menu",
    "title": "운영실 전체 메뉴",
    "description": "운영실 인증 후 전체 메뉴를 확인합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "전체",
    "priority": 57,
    "opsOnly": true
  },
  {
    "href": "/ops/privacy-audit",
    "title": "개인정보 동의·열람 감사센터",
    "description": "대상자 동의 상태와 운영실·도움망·지자체 개인정보 열람 기록을 관리합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "개인정보",
    "priority": 59,
    "opsOnly": true
  },
  {
    "href": "/ops/submission-package",
    "title": "운영실 제출 패키지",
    "description": "운영실에서 지자체 제출용 증빙 파일 묶음을 생성합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "제출",
    "priority": 60,
    "opsOnly": true
  },
  {
    "href": "/ops/pilot",
    "title": "실증 운영실",
    "description": "실증 운영 현황을 관리합니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "실증",
    "priority": 61,
    "opsOnly": true
  },
  {
    "href": "/ops/pilot-manual",
    "title": "운영실 실증 운영 매뉴얼",
    "description": "운영실 기준으로 실증 단계별 체크리스트와 교육 기록을 관리합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "매뉴얼",
    "priority": 61,
    "opsOnly": true
  },
  {
    "href": "/ops/reports",
    "title": "운영 보고서",
    "description": "운영실 처리 기록과 보고서를 확인합니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "보고서",
    "priority": 62,
    "opsOnly": true
  },
  {
    "href": "/ops/demo-runner",
    "title": "운영실 실증 시연 모드",
    "description": "운영실에서 지자체 시연용 대상자·사건·도움망·문자·보고서 흐름을 생성합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "시연",
    "priority": 62,
    "opsOnly": true
  },
  {
    "href": "/ops/proposal-leads",
    "title": "제안 문의 관리",
    "description": "외부 제안 페이지에서 접수된 지자체·기관 문의를 운영실에서 관리합니다.",
    "category": "운영실 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "문의",
    "priority": 63,
    "opsOnly": true
  },
  {
    "href": "/gov/readiness",
    "title": "지자체 제출 준비상태",
    "description": "환경변수, DB, 공공 제출 체크리스트를 확인합니다.",
    "category": "정부·지자체 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "B2G",
    "priority": 70,
    "opsOnly": true
  },
  {
    "href": "/gov/submission/print",
    "title": "지자체 제출본 출력",
    "description": "A4 제출본을 인쇄 또는 PDF로 저장합니다.",
    "category": "정부·지자체 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "제출",
    "priority": 71,
    "opsOnly": true
  },
  {
    "href": "/gov/reports",
    "title": "지자체 운영 보고서",
    "description": "주간·월간 운영보고서를 확인합니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "보고서",
    "priority": 73,
    "opsOnly": true
  },
  {
    "href": "/gov/submission",
    "title": "지자체 제출 패키지",
    "description": "제안서, 제출본, 운영 자료를 관리합니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "제출",
    "priority": 75,
    "opsOnly": true
  },
  {
    "href": "/gov/privacy-audit",
    "title": "지자체 개인정보 열람 감사",
    "description": "지자체 실증 제출용 개인정보 동의·열람 감사 기록을 확인합니다.",
    "category": "정부·지자체 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "감사",
    "priority": 75,
    "opsOnly": true
  },
  {
    "href": "/gov/submission-package",
    "title": "지자체 제출 패키지",
    "description": "대상자 현황, 운영보고서, 사건 이력, 알림, 개인정보 감사 로그를 제출 묶음으로 생성합니다.",
    "category": "정부·지자체 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "패키지",
    "priority": 76,
    "opsOnly": true
  },
  {
    "href": "/gov/pilot-manual",
    "title": "지자체 실증 운영 매뉴얼",
    "description": "1–2개월 인프라 구축, 3–5개월 관제 최적화, 6개월 성과 도출 운영 순서를 관리합니다.",
    "category": "정부·지자체 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "매뉴얼",
    "priority": 77,
    "opsOnly": true
  },
  {
    "href": "/gov/demo-runner",
    "title": "지자체 실증 시연 모드",
    "description": "버튼 하나로 대상자, 사건, 도움망, 문자 대기열, 타임라인, 보고서 반영 흐름을 생성합니다.",
    "category": "정부·지자체 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "시연",
    "priority": 78,
    "opsOnly": true
  },
  {
    "href": "/privacy",
    "title": "개인정보처리방침",
    "description": "개인정보 처리 기준을 확인합니다.",
    "category": "공통",
    "roles": [
      "all",
      "parent",
      "child",
      "careWorker",
      "ops"
    ],
    "badge": "개인정보",
    "priority": 80,
    "opsOnly": false
  },
  {
    "href": "/gov/private-pilot",
    "title": "자체 예비 실증 현황",
    "description": "안부웍스 자체 예비 실증의 참여 가구, 안부 신호, 긴급 요청, 미니 리포트를 확인합니다.",
    "category": "정부·지자체 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "실증",
    "priority": 80,
    "opsOnly": true
  },
  {
    "href": "/terms",
    "title": "이용약관",
    "description": "서비스 이용약관을 확인합니다.",
    "category": "공통",
    "roles": [
      "all",
      "parent",
      "child",
      "careWorker",
      "ops"
    ],
    "badge": "약관",
    "priority": 81,
    "opsOnly": false
  },
  {
    "href": "/mobile/provider",
    "title": "요양보호사·돌봄파트너 앱",
    "description": "요양보호사·돌봄파트너가 긴급 요청함으로 이동합니다.",
    "category": "요양보호사·케어파트너 필수",
    "roles": [
      "all",
      "careWorker",
      "ops"
    ],
    "badge": "앱",
    "priority": 81,
    "opsOnly": false
  },
  {
    "href": "/gov/pilot-qa",
    "title": "지자체 실증 QA·시연 스크립트",
    "description": "지자체 담당자에게 보여줄 실증 점검표와 발표 흐름을 관리합니다.",
    "category": "정부·지자체 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "QA",
    "priority": 81,
    "opsOnly": true
  },
  {
    "href": "/provider/urgent-requests",
    "title": "요양보호사 긴급 요청함",
    "description": "요양보호사·돌봄파트너가 긴급 확인 요청을 수락하고 완료 처리합니다.",
    "category": "요양보호사·케어파트너 필수",
    "roles": [
      "all",
      "careWorker",
      "ops"
    ],
    "badge": "긴급요청",
    "priority": 82,
    "opsOnly": false
  },
  {
    "href": "/gov/one-page-proposal",
    "title": "지자체 1페이지 실증 제안서",
    "description": "안부웍스 고령자 AIP 돌봄 관제 실증 협업 1페이지 제안서입니다.",
    "category": "정부·지자체 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "제안서",
    "priority": 82,
    "opsOnly": true
  },
  {
    "href": "/gov/outreach-crm",
    "title": "지자체 실증 협업 관리",
    "description": "지자체 실증 협업 제안 대상과 접촉 상태를 관리합니다.",
    "category": "정부·지자체 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "CRM",
    "priority": 83,
    "opsOnly": true
  },
  {
    "href": "/parent/consent",
    "title": "Consent",
    "description": "부모님 안부 입력과 접속에 필요한 추가 화면입니다.",
    "category": "부모님 추가 필수",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "부모님",
    "priority": 120,
    "opsOnly": false
  },
  {
    "href": "/parent/convenience",
    "title": "Convenience",
    "description": "부모님 안부 입력과 접속에 필요한 추가 화면입니다.",
    "category": "부모님 추가 필수",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "부모님",
    "priority": 120,
    "opsOnly": false
  },
  {
    "href": "/parent/install",
    "title": "Install",
    "description": "부모님 안부 입력과 접속에 필요한 추가 화면입니다.",
    "category": "부모님 추가 필수",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "부모님",
    "priority": 120,
    "opsOnly": false
  },
  {
    "href": "/parent/login",
    "title": "Login",
    "description": "부모님 안부 입력과 접속에 필요한 추가 화면입니다.",
    "category": "부모님 추가 필수",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "부모님",
    "priority": 120,
    "opsOnly": false
  },
  {
    "href": "/child/assignments",
    "title": "Assignments",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/care-reports",
    "title": "Care Reports",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/cases",
    "title": "Cases",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child",
    "title": "Child",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/convenience",
    "title": "Convenience",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/costs",
    "title": "Costs",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/daily-care",
    "title": "Daily Care",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/discharge",
    "title": "Discharge",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/documents",
    "title": "Documents",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/family",
    "title": "Family",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/family-code",
    "title": "Family Code",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/files",
    "title": "Files",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/intake-inbox",
    "title": "Intake Inbox",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/family/join",
    "title": "Join",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/manager-evaluations",
    "title": "Manager Evaluations",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/matching",
    "title": "Matching",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/meals",
    "title": "Meals",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/appointments/new",
    "title": "New",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/notifications",
    "title": "Notifications",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/report",
    "title": "Report",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/reports",
    "title": "Reports",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/routines",
    "title": "Routines",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/safety-loop",
    "title": "Safety Loop",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/social-care",
    "title": "Social Care",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/summaries",
    "title": "Summaries",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/tasks",
    "title": "Tasks",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/today",
    "title": "Today",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/weekly-report",
    "title": "Weekly Report",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/child/worry",
    "title": "Worry",
    "description": "자녀·보호자 확인과 후속조치에 필요한 추가 화면입니다.",
    "category": "자녀·보호자 추가 필수",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 130,
    "opsOnly": false
  },
  {
    "href": "/care-partner/apply",
    "title": "Apply",
    "description": "요양보호사·케어파트너 요청 처리에 필요한 추가 화면입니다.",
    "category": "요양보호사·케어파트너 추가 필수",
    "roles": [
      "all",
      "careWorker",
      "ops"
    ],
    "badge": "도움망",
    "priority": 140,
    "opsOnly": false
  },
  {
    "href": "/care-partner/guide",
    "title": "Guide",
    "description": "요양보호사·케어파트너 요청 처리에 필요한 추가 화면입니다.",
    "category": "요양보호사·케어파트너 추가 필수",
    "roles": [
      "all",
      "careWorker",
      "ops"
    ],
    "badge": "도움망",
    "priority": 140,
    "opsOnly": false
  },
  {
    "href": "/care-partner/report-guide",
    "title": "Report Guide",
    "description": "요양보호사·케어파트너 요청 처리에 필요한 추가 화면입니다.",
    "category": "요양보호사·케어파트너 추가 필수",
    "roles": [
      "all",
      "careWorker",
      "ops"
    ],
    "badge": "도움망",
    "priority": 140,
    "opsOnly": false
  },
  {
    "href": "/ops/anbu-control",
    "title": "Anbu Control",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/assignments",
    "title": "Assignments",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/audit",
    "title": "Audit",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/automation",
    "title": "Automation",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/care-cases",
    "title": "Care Cases",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/care-passport",
    "title": "Care Passport",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/care-reports-review",
    "title": "Care Reports Review",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/care-requests",
    "title": "Care Requests",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/cases",
    "title": "Cases",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/command-center",
    "title": "Command Center",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/contact-center",
    "title": "Contact Center",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/convenience",
    "title": "Convenience",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/costs",
    "title": "Costs",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/crm",
    "title": "Crm",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/cron-health",
    "title": "Cron Health",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/daily-care",
    "title": "Daily Care",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/dashboard",
    "title": "Dashboard",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/demo-scenario",
    "title": "Demo Scenario",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/discharge",
    "title": "Discharge",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/documents",
    "title": "Documents",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/families",
    "title": "Families",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/files",
    "title": "Files",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/flow-qa",
    "title": "Flow Qa",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/intake",
    "title": "Intake",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/intake-inbox",
    "title": "Intake Inbox",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/integrations",
    "title": "Integrations",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/kakao-templates",
    "title": "Kakao Templates",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/manager-field",
    "title": "Manager Field",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/manager-matching",
    "title": "Manager Matching",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/manager-offers",
    "title": "Manager Offers",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/manager-verification",
    "title": "Manager Verification",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/manager-vetting",
    "title": "Manager Vetting",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/managers",
    "title": "Managers",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/matching",
    "title": "Matching",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/meals",
    "title": "Meals",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/metrics",
    "title": "Metrics",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/notifications",
    "title": "Notifications",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/outbox",
    "title": "Outbox",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/outcomes",
    "title": "Outcomes",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/outreach-crm",
    "title": "Outreach Crm",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/partner-db",
    "title": "Partner Db",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/partners",
    "title": "Partners",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/plan-builder",
    "title": "Plan Builder",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/qa",
    "title": "Qa",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/risk-action",
    "title": "Risk Action",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/risks",
    "title": "Risks",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/routines",
    "title": "Routines",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/safety",
    "title": "Safety",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/social-care",
    "title": "Social Care",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/subscriptions",
    "title": "Subscriptions",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/tasks",
    "title": "Tasks",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/technology",
    "title": "Technology",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/today",
    "title": "Today",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/ops/worry-center",
    "title": "Worry Center",
    "description": "운영실 관리와 자동운영에 필요한 추가 화면입니다.",
    "category": "운영실 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 150,
    "opsOnly": true
  },
  {
    "href": "/gov/audit",
    "title": "Audit",
    "description": "지자체 실증, 제출, 보고에 필요한 추가 화면입니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "B2G",
    "priority": 160,
    "opsOnly": true
  },
  {
    "href": "/gov/cases",
    "title": "Cases",
    "description": "지자체 실증, 제출, 보고에 필요한 추가 화면입니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "B2G",
    "priority": 160,
    "opsOnly": true
  },
  {
    "href": "/gov/compliance",
    "title": "Compliance",
    "description": "지자체 실증, 제출, 보고에 필요한 추가 화면입니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "B2G",
    "priority": 160,
    "opsOnly": true
  },
  {
    "href": "/gov/dashboard",
    "title": "Dashboard",
    "description": "지자체 실증, 제출, 보고에 필요한 추가 화면입니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "B2G",
    "priority": 160,
    "opsOnly": true
  },
  {
    "href": "/gov/export",
    "title": "Export",
    "description": "지자체 실증, 제출, 보고에 필요한 추가 화면입니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "B2G",
    "priority": 160,
    "opsOnly": true
  },
  {
    "href": "/gov",
    "title": "Gov",
    "description": "지자체 실증, 제출, 보고에 필요한 추가 화면입니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "B2G",
    "priority": 160,
    "opsOnly": true
  },
  {
    "href": "/gov/iot",
    "title": "Iot",
    "description": "지자체 실증, 제출, 보고에 필요한 추가 화면입니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "B2G",
    "priority": 160,
    "opsOnly": true
  },
  {
    "href": "/gov/proposal",
    "title": "Proposal",
    "description": "지자체 실증, 제출, 보고에 필요한 추가 화면입니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "B2G",
    "priority": 160,
    "opsOnly": true
  },
  {
    "href": "/gov/recipients",
    "title": "Recipients",
    "description": "지자체 실증, 제출, 보고에 필요한 추가 화면입니다.",
    "category": "정부·지자체 추가 필수",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "B2G",
    "priority": 160,
    "opsOnly": true
  }
] as MenuLink[]

export const developerMenuLinks: MenuLink[] = [
  {
    "href": "/care-cases",
    "title": "Care Cases",
    "description": "/care-cases 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-comfort",
    "title": "Care Comfort",
    "description": "/care-comfort 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-costs",
    "title": "Care Costs",
    "description": "/care-costs 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-difference",
    "title": "Care Difference",
    "description": "/care-difference 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-discharge",
    "title": "Care Discharge",
    "description": "/care-discharge 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-documents",
    "title": "Care Documents",
    "description": "/care-documents 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-files",
    "title": "Care Files",
    "description": "/care-files 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-intake",
    "title": "Care Intake",
    "description": "/care-intake 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-matching",
    "title": "Care Matching",
    "description": "/care-matching 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-meal",
    "title": "Care Meal",
    "description": "/care-meal 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-meals",
    "title": "Care Meals",
    "description": "/care-meals 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-notifications",
    "title": "Care Notifications",
    "description": "/care-notifications 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-packs",
    "title": "Care Packs",
    "description": "/care-packs 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-passport",
    "title": "Care Passport",
    "description": "/care-passport 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-request",
    "title": "Care Request",
    "description": "/care-request 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-room",
    "title": "Care Room",
    "description": "/care-room 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-routines",
    "title": "Care Routines",
    "description": "/care-routines 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-schedule",
    "title": "Care Schedule",
    "description": "/care-schedule 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-scope",
    "title": "Care Scope",
    "description": "/care-scope 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-social",
    "title": "Care Social",
    "description": "/care-social 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-plans/discharge",
    "title": "Discharge",
    "description": "/care-plans/discharge 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-request/thanks",
    "title": "Thanks",
    "description": "/care-request/thanks 경로로 이동합니다.",
    "category": "개발자 경로 · 도움망",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/ops/login",
    "title": "Login",
    "description": "/ops/login 경로로 이동합니다.",
    "category": "개발자 경로 · 운영실",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/access-login",
    "title": "Access Login",
    "description": "/access-login 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/account",
    "title": "Account",
    "description": "/account 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin",
    "title": "Admin",
    "description": "/admin 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/agent",
    "title": "Agent",
    "description": "/admin/agent 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/anbu-routines",
    "title": "Anbu Routines",
    "description": "/anbu-routines 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/anbuon",
    "title": "Anbuon",
    "description": "/anbuon 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/app",
    "title": "App",
    "description": "/app 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/apply",
    "title": "Apply",
    "description": "/manager/apply 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/autoloop",
    "title": "Autoloop",
    "description": "/admin/autoloop 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/billing",
    "title": "Billing",
    "description": "/billing 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/blog",
    "title": "Blog",
    "description": "/blog 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/buyer-demo",
    "title": "Buyer Demo",
    "description": "/buyer-demo 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/auth/callback-client",
    "title": "Callback Client",
    "description": "/auth/callback-client 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/login/check-email",
    "title": "Check Email",
    "description": "/login/check-email 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/billing/checkout",
    "title": "Checkout",
    "description": "/billing/checkout 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/checkout",
    "title": "Checkout",
    "description": "/checkout 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/clear-cache",
    "title": "Clear Cache",
    "description": "/clear-cache 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/contact",
    "title": "Contact",
    "description": "/contact 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/data-deletion",
    "title": "Data Deletion",
    "description": "/data-deletion 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/legal/data-safety",
    "title": "Data Safety",
    "description": "/legal/data-safety 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/demo-login",
    "title": "Demo Login",
    "description": "/demo-login 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/demo-start",
    "title": "Demo Start",
    "description": "/demo-start 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/deploy-readiness",
    "title": "Deploy Readiness",
    "description": "/deploy-readiness 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/earnings",
    "title": "Earnings",
    "description": "/manager/earnings 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/billing/fail",
    "title": "Fail",
    "description": "/billing/fail 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/payments/fail",
    "title": "Fail",
    "description": "/payments/fail 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/signup/guardian",
    "title": "Guardian",
    "description": "/signup/guardian 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/health",
    "title": "Health",
    "description": "/admin/health 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/health-disclaimer",
    "title": "Health Disclaimer",
    "description": "/health-disclaimer 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/legal/health-disclaimer",
    "title": "Health Disclaimer",
    "description": "/legal/health-disclaimer 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/impact",
    "title": "Impact",
    "description": "/impact 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/install",
    "title": "Install",
    "description": "/install 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/install",
    "title": "Install",
    "description": "/manager/install 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/kakao-checklist",
    "title": "Kakao Checklist",
    "description": "/kakao-checklist 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/landing",
    "title": "Landing",
    "description": "/landing 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/setup/legal",
    "title": "Legal",
    "description": "/setup/legal 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/legal/location-notice",
    "title": "Location Notice",
    "description": "/legal/location-notice 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/location-terms",
    "title": "Location Terms",
    "description": "/location-terms 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager",
    "title": "Manager",
    "description": "/manager 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/signup/manager",
    "title": "Manager",
    "description": "/signup/manager 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/mobile-check",
    "title": "Mobile Check",
    "description": "/mobile-check 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/my",
    "title": "My",
    "description": "/my 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/naver",
    "title": "Naver",
    "description": "/admin/naver 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/naver-five",
    "title": "Naver Five",
    "description": "/admin/naver-five 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/setup/notifications",
    "title": "Notifications",
    "description": "/setup/notifications 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/offers",
    "title": "Offers",
    "description": "/manager/offers 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/offline",
    "title": "Offline",
    "description": "/offline 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/onboarding",
    "title": "Onboarding",
    "description": "/onboarding 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/partners",
    "title": "Partners",
    "description": "/partners 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/setup/partners",
    "title": "Partners",
    "description": "/setup/partners 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/setup/payments",
    "title": "Payments",
    "description": "/setup/payments 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/permissions",
    "title": "Permissions",
    "description": "/permissions 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/settings/permissions",
    "title": "Permissions",
    "description": "/settings/permissions 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/platform-roadmap",
    "title": "Platform Roadmap",
    "description": "/platform-roadmap 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/play-store-ready",
    "title": "Play Store Ready",
    "description": "/play-store-ready 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/pricing",
    "title": "Pricing",
    "description": "/pricing 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/legal/privacy",
    "title": "Privacy",
    "description": "/legal/privacy 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/privacy-consent",
    "title": "Privacy Consent",
    "description": "/privacy-consent 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/publish",
    "title": "Publish",
    "description": "/admin/publish 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/qa-scenarios",
    "title": "Qa Scenarios",
    "description": "/qa-scenarios 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/register",
    "title": "Register",
    "description": "/manager/register 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/safety-protocol",
    "title": "Safety Protocol",
    "description": "/safety-protocol 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/signup",
    "title": "Signup",
    "description": "/signup 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/subscription",
    "title": "Subscription",
    "description": "/subscription 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/billing/success",
    "title": "Success",
    "description": "/billing/success 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/payments/success",
    "title": "Success",
    "description": "/payments/success 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/setup/supabase",
    "title": "Supabase",
    "description": "/setup/supabase 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/partner/tasks",
    "title": "Tasks",
    "description": "/partner/tasks 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/legal/terms",
    "title": "Terms",
    "description": "/legal/terms 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/today",
    "title": "Today",
    "description": "/manager/today 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/trust",
    "title": "Trust",
    "description": "/trust 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/login/phone/verify",
    "title": "Verify",
    "description": "/login/phone/verify 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/verify",
    "title": "Verify",
    "description": "/manager/verify 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/vetting",
    "title": "Vetting",
    "description": "/manager/vetting 경로로 이동합니다.",
    "category": "개발자 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "debug",
    "priority": 900,
    "opsOnly": false
  }
] as MenuLink[]

export const allMenuLinks: MenuLink[] = [...menuLinks, ...developerMenuLinks]


/* ROLE_PORTAL_POLICY_START */
const rolePortalSafeCommonHrefs = new Set<string>([
  '/',
  '/login',
  '/family-link',
  '/response/about',
  '/privacy',
  '/terms',
  '/support',
  '/proposal'
])

function rolePortalCleanHref(href: string): string {
  const base = href.split('?', 1)[0] || '/'
  if (base !== '/' && base.endsWith('/')) return base.slice(0, -1)
  return base
}

function rolePortalRestrictedForRole(link: MenuLink, role: PortalRole): boolean {
  const rawHref = link.href || ''
  const href = rolePortalCleanHref(rawHref)

  if (role === 'ops') return false

  if (link.opsOnly) return true
  if (rawHref.includes('scope=ops')) return true

  if (href === '/admin-menu') return true
  if (href.startsWith('/ops')) return true
  if (href.startsWith('/gov')) return true

  const roleLockedPrefixes: Array<[string, PortalRole]> = [
    ['/portal/parent', 'parent'],
    ['/portal/child', 'child'],
    ['/portal/care-worker', 'careWorker'],
    ['/portal/ops', 'ops']
  ]

  for (const [prefix, ownerRole] of roleLockedPrefixes) {
    if (href.startsWith(prefix) && role !== ownerRole) return true
  }

  if (role === 'parent') {
    if (href.startsWith('/child')) return true
    if (href.startsWith('/provider')) return true
    if (href.startsWith('/care-worker')) return true
    if (href.startsWith('/care-partner')) return true
  }

  if (role === 'child') {
    if (href.startsWith('/parent')) return true
    if (href.startsWith('/provider')) return true
    if (href.startsWith('/care-worker')) return true
    if (href.startsWith('/care-partner')) return true
  }

  if (role === 'careWorker') {
    if (href.startsWith('/parent')) return true
    if (href.startsWith('/child')) return true
    if (href.startsWith('/family')) return true
    if (href.startsWith('/guardian')) return true
  }

  return false
}

function rolePortalIsSafeCommon(link: MenuLink): boolean {
  const href = rolePortalCleanHref(link.href)
  if (link.opsOnly) return false
  if (link.href.includes('scope=ops')) return false
  if (href === '/menu') return false
  if (href === '/admin-menu') return false
  return rolePortalSafeCommonHrefs.has(href)
}

function rolePortalSortLinks(links: MenuLink[]): MenuLink[] {
  const seen = new Set<string>()

  return links
    .filter((link) => {
      const key = link.href
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      if (a.category !== b.category) return a.category.localeCompare(b.category)
      return a.title.localeCompare(b.title)
    })
}
/* ROLE_PORTAL_POLICY_END */


export function linksForRole(role: PortalRole, includeDebug = false): MenuLink[] {
  const source = includeDebug ? allMenuLinks : menuLinks

  if (role === 'all') return rolePortalSortLinks(source)
  if (role === 'ops') return rolePortalSortLinks(source)

  return rolePortalSortLinks(
    source.filter((link) => {
      if (rolePortalRestrictedForRole(link, role)) return false
      if (link.roles.includes(role)) return true
      return rolePortalIsSafeCommon(link)
    })
  )
}
