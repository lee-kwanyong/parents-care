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
    "title": "전체 어드민 메뉴",
    "shortTitle": "전체",
    "description": "안부웍스에서 만든 모든 화면을 한 곳에서 확인합니다."
  },
  "parent": {
    "title": "부모님 페이지",
    "shortTitle": "부모님",
    "description": "부모님이 안부 신호를 입력하고 자녀에게 상태를 알리는 화면입니다."
  },
  "child": {
    "title": "자녀·보호자 페이지",
    "shortTitle": "자녀",
    "description": "자녀와 보호자가 부모님 상태, 리포트, 후속조치를 확인하는 화면입니다."
  },
  "careWorker": {
    "title": "요양보호사·케어파트너 페이지",
    "shortTitle": "도움망",
    "description": "요양보호사, 케어파트너, 지역상점, 약국이 받은 요청을 처리하는 화면입니다."
  },
  "ops": {
    "title": "운영실 페이지",
    "shortTitle": "운영실",
    "description": "운영실 자동운영, 알림, 도움망, 지자체 제출 업무를 관리하는 화면입니다."
  }
} as Record<PortalRole, { title: string; shortTitle: string; description: string }>

export const menuLinks: MenuLink[] = [
  {
    "href": "/",
    "title": "홈",
    "description": "안부웍스 서비스 첫 화면입니다.",
    "category": "공통",
    "roles": [
      "all",
      "parent",
      "child",
      "careWorker",
      "ops"
    ],
    "badge": "공통",
    "priority": 1,
    "opsOnly": false
  },
  {
    "href": "/admin-menu",
    "title": "전체 어드민 메뉴",
    "description": "부모님, 자녀, 요양보호사·케어파트너, 운영실 화면을 모두 모았습니다.",
    "category": "공통",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "전체",
    "priority": 2,
    "opsOnly": false
  },
  {
    "href": "/menu",
    "title": "전체 메뉴",
    "description": "헤더 메뉴에서 접근하는 전체 메뉴입니다.",
    "category": "공통",
    "roles": [
      "all",
      "parent",
      "child",
      "careWorker",
      "ops"
    ],
    "badge": "메뉴",
    "priority": 3,
    "opsOnly": false
  },
  {
    "href": "/portal/parent",
    "title": "부모님 페이지",
    "description": "부모님이 안부 신호를 입력하는 화면 모음입니다.",
    "category": "역할별 시작 화면",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "부모님",
    "priority": 10,
    "opsOnly": false
  },
  {
    "href": "/portal/child",
    "title": "자녀·보호자 페이지",
    "description": "부모님 상태와 후속조치를 확인하는 화면 모음입니다.",
    "category": "역할별 시작 화면",
    "roles": [
      "all",
      "child"
    ],
    "badge": "자녀",
    "priority": 11,
    "opsOnly": false
  },
  {
    "href": "/portal/care-worker",
    "title": "요양보호사·케어파트너 페이지",
    "description": "지역 도움망이 요청을 수락하고 처리하는 화면 모음입니다.",
    "category": "역할별 시작 화면",
    "roles": [
      "all",
      "careWorker"
    ],
    "badge": "도움망",
    "priority": 12,
    "opsOnly": false
  },
  {
    "href": "/portal/ops",
    "title": "운영실 페이지",
    "description": "운영실 자동운영과 관제 화면 모음입니다.",
    "category": "역할별 시작 화면",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 13,
    "opsOnly": false
  },
  {
    "href": "/parent",
    "title": "부모님 안부 입력",
    "description": "부모님이 식사, 복약, 몸 상태, 도움 요청을 남기는 화면입니다.",
    "category": "부모님",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "부모님",
    "priority": 20,
    "opsOnly": false
  },
  {
    "href": "/family-link",
    "title": "부모님 연결코드 만들기",
    "description": "보호자가 부모님과 연결할 6자리 코드를 만듭니다.",
    "category": "자녀·보호자",
    "roles": [
      "all",
      "child"
    ],
    "badge": "연결",
    "priority": 30,
    "opsOnly": false
  },
  {
    "href": "/login",
    "title": "로그인·회원가입",
    "description": "보호자 회원가입과 로그인을 시작합니다.",
    "category": "자녀·보호자",
    "roles": [
      "all",
      "child"
    ],
    "badge": "로그인",
    "priority": 31,
    "opsOnly": false
  },
  {
    "href": "/child/dashboard",
    "title": "자녀 리포트 대시보드",
    "description": "부모님 안부 기록과 리포트를 확인합니다.",
    "category": "자녀·보호자",
    "roles": [
      "all",
      "child"
    ],
    "badge": "리포트",
    "priority": 32,
    "opsOnly": false
  },
  {
    "href": "/family/actions",
    "title": "가족 실행 보드",
    "description": "가족이 맡은 실행 요청을 확인하고 처리합니다.",
    "category": "자녀·보호자",
    "roles": [
      "all",
      "child"
    ],
    "badge": "가족",
    "priority": 33,
    "opsOnly": false
  },
  {
    "href": "/response",
    "title": "보호자 후속조치",
    "description": "부모님 신호에 대한 후속조치를 보호자 기준으로 확인합니다.",
    "category": "자녀·보호자",
    "roles": [
      "all",
      "child"
    ],
    "badge": "후속조치",
    "priority": 34,
    "opsOnly": false
  },
  {
    "href": "/response/about",
    "title": "지역 안심망 소개",
    "description": "가족, 돌봄파트너, 지역상점, 약국, 수행기관 연결 구조를 설명합니다.",
    "category": "자녀·보호자",
    "roles": [
      "all",
      "child",
      "careWorker",
      "ops"
    ],
    "badge": "소개",
    "priority": 35,
    "opsOnly": false
  },
  {
    "href": "/provider/requests",
    "title": "지역 도움망 요청함",
    "description": "요양보호사·케어파트너·상점·약국이 받은 요청을 수락하고 완료합니다.",
    "category": "요양보호사·케어파트너",
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
    "href": "/ops",
    "title": "운영실 어드민 홈",
    "description": "운영실에서 필요한 모든 관리 화면으로 이동합니다.",
    "category": "운영실",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "운영실",
    "priority": 50,
    "opsOnly": true
  },
  {
    "href": "/ops/admin-menu",
    "title": "운영실 전체 메뉴",
    "description": "운영실 인증 후 전체 화면을 확인합니다.",
    "category": "운영실",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "전체",
    "priority": 51,
    "opsOnly": true
  },
  {
    "href": "/ops/autopilot",
    "title": "운영실 오토파일럿",
    "description": "부모님 신호별 플레이북으로 다음 조치를 자동 추천하고 실행합니다.",
    "category": "운영실 자동운영",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "오토파일럿",
    "priority": 52,
    "opsOnly": true
  },
  {
    "href": "/ops/heartbeat",
    "title": "운영실 자동운영 Heartbeat",
    "description": "오토파일럿, 에스컬레이션, 문자 대기열을 주기적으로 점검합니다.",
    "category": "운영실 자동운영",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "Heartbeat",
    "priority": 53,
    "opsOnly": true
  },
  {
    "href": "/ops/network",
    "title": "도움망 네트워크",
    "description": "돌봄파트너, 요양보호사, 지역상점, 약국, 수행기관을 등록·관리합니다.",
    "category": "운영실 자동운영",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "도움망",
    "priority": 54,
    "opsOnly": true
  },
  {
    "href": "/ops/notification-dispatch",
    "title": "알림 발송센터",
    "description": "문자 초안을 선택해 SMS를 대기열에 넣거나 바로 발송합니다.",
    "category": "운영실 알림",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "문자",
    "priority": 55,
    "opsOnly": true
  },
  {
    "href": "/ops/response-escalation",
    "title": "자동 에스컬레이션",
    "description": "미수락·미완료 요청을 수동 연결 필요 상태로 승격합니다.",
    "category": "운영실 자동운영",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "에스컬레이션",
    "priority": 56,
    "opsOnly": true
  },
  {
    "href": "/response?scope=ops",
    "title": "운영실 후속조치 관제",
    "description": "전체 후속조치 요청을 보고 지역 도움망으로 전파합니다.",
    "category": "운영실 관제",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "관제",
    "priority": 57,
    "opsOnly": true
  },
  {
    "href": "/gov/readiness",
    "title": "지자체 제출 준비상태",
    "description": "환경변수, DB, 공공 제출 체크리스트를 확인합니다.",
    "category": "정부·지자체",
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
    "category": "정부·지자체",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "제출",
    "priority": 71,
    "opsOnly": true
  },
  {
    "href": "/access-login",
    "title": "Access Login",
    "description": "/access-login 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/account",
    "title": "Account",
    "description": "/account 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin",
    "title": "Admin",
    "description": "/admin 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/agent",
    "title": "Agent",
    "description": "/admin/agent 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/anbu-routines",
    "title": "Anbu Routines",
    "description": "/anbu-routines 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/anbuon",
    "title": "Anbuon",
    "description": "/anbuon 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/app",
    "title": "App",
    "description": "/app 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-partner/apply",
    "title": "Apply",
    "description": "/care-partner/apply 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/apply",
    "title": "Apply",
    "description": "/manager/apply 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/autoloop",
    "title": "Autoloop",
    "description": "/admin/autoloop 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/billing",
    "title": "Billing",
    "description": "/billing 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/blog",
    "title": "Blog",
    "description": "/blog 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/buyer-demo",
    "title": "Buyer Demo",
    "description": "/buyer-demo 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/auth/callback-client",
    "title": "Callback Client",
    "description": "/auth/callback-client 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-cases",
    "title": "Care Cases",
    "description": "/care-cases 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-comfort",
    "title": "Care Comfort",
    "description": "/care-comfort 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-costs",
    "title": "Care Costs",
    "description": "/care-costs 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-difference",
    "title": "Care Difference",
    "description": "/care-difference 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-discharge",
    "title": "Care Discharge",
    "description": "/care-discharge 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-documents",
    "title": "Care Documents",
    "description": "/care-documents 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-files",
    "title": "Care Files",
    "description": "/care-files 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-intake",
    "title": "Care Intake",
    "description": "/care-intake 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-matching",
    "title": "Care Matching",
    "description": "/care-matching 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-meal",
    "title": "Care Meal",
    "description": "/care-meal 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-meals",
    "title": "Care Meals",
    "description": "/care-meals 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-notifications",
    "title": "Care Notifications",
    "description": "/care-notifications 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-packs",
    "title": "Care Packs",
    "description": "/care-packs 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-passport",
    "title": "Care Passport",
    "description": "/care-passport 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-request",
    "title": "Care Request",
    "description": "/care-request 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-room",
    "title": "Care Room",
    "description": "/care-room 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-routines",
    "title": "Care Routines",
    "description": "/care-routines 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-schedule",
    "title": "Care Schedule",
    "description": "/care-schedule 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-scope",
    "title": "Care Scope",
    "description": "/care-scope 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-social",
    "title": "Care Social",
    "description": "/care-social 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/login/check-email",
    "title": "Check Email",
    "description": "/login/check-email 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/billing/checkout",
    "title": "Checkout",
    "description": "/billing/checkout 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/checkout",
    "title": "Checkout",
    "description": "/checkout 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/clear-cache",
    "title": "Clear Cache",
    "description": "/clear-cache 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/contact",
    "title": "Contact",
    "description": "/contact 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/data-deletion",
    "title": "Data Deletion",
    "description": "/data-deletion 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/legal/data-safety",
    "title": "Data Safety",
    "description": "/legal/data-safety 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/demo-login",
    "title": "Demo Login",
    "description": "/demo-login 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/demo-start",
    "title": "Demo Start",
    "description": "/demo-start 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/deploy-readiness",
    "title": "Deploy Readiness",
    "description": "/deploy-readiness 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-plans/discharge",
    "title": "Discharge",
    "description": "/care-plans/discharge 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/earnings",
    "title": "Earnings",
    "description": "/manager/earnings 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/billing/fail",
    "title": "Fail",
    "description": "/billing/fail 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/payments/fail",
    "title": "Fail",
    "description": "/payments/fail 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/signup/guardian",
    "title": "Guardian",
    "description": "/signup/guardian 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-partner/guide",
    "title": "Guide",
    "description": "/care-partner/guide 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/health",
    "title": "Health",
    "description": "/admin/health 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/health-disclaimer",
    "title": "Health Disclaimer",
    "description": "/health-disclaimer 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/legal/health-disclaimer",
    "title": "Health Disclaimer",
    "description": "/legal/health-disclaimer 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/impact",
    "title": "Impact",
    "description": "/impact 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/install",
    "title": "Install",
    "description": "/install 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/install",
    "title": "Install",
    "description": "/manager/install 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/kakao-checklist",
    "title": "Kakao Checklist",
    "description": "/kakao-checklist 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/landing",
    "title": "Landing",
    "description": "/landing 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/setup/legal",
    "title": "Legal",
    "description": "/setup/legal 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/legal/location-notice",
    "title": "Location Notice",
    "description": "/legal/location-notice 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/location-terms",
    "title": "Location Terms",
    "description": "/location-terms 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager",
    "title": "Manager",
    "description": "/manager 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/signup/manager",
    "title": "Manager",
    "description": "/signup/manager 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/mobile-check",
    "title": "Mobile Check",
    "description": "/mobile-check 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/my",
    "title": "My",
    "description": "/my 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/naver",
    "title": "Naver",
    "description": "/admin/naver 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/naver-five",
    "title": "Naver Five",
    "description": "/admin/naver-five 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/setup/notifications",
    "title": "Notifications",
    "description": "/setup/notifications 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/offers",
    "title": "Offers",
    "description": "/manager/offers 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/offline",
    "title": "Offline",
    "description": "/offline 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/onboarding",
    "title": "Onboarding",
    "description": "/onboarding 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/partners",
    "title": "Partners",
    "description": "/partners 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/setup/partners",
    "title": "Partners",
    "description": "/setup/partners 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/setup/payments",
    "title": "Payments",
    "description": "/setup/payments 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/permissions",
    "title": "Permissions",
    "description": "/permissions 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/settings/permissions",
    "title": "Permissions",
    "description": "/settings/permissions 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/platform-roadmap",
    "title": "Platform Roadmap",
    "description": "/platform-roadmap 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/play-store-ready",
    "title": "Play Store Ready",
    "description": "/play-store-ready 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/pricing",
    "title": "Pricing",
    "description": "/pricing 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/legal/privacy",
    "title": "Privacy",
    "description": "/legal/privacy 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/privacy",
    "title": "Privacy",
    "description": "/privacy 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/privacy-consent",
    "title": "Privacy Consent",
    "description": "/privacy-consent 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/admin/publish",
    "title": "Publish",
    "description": "/admin/publish 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/qa-scenarios",
    "title": "Qa Scenarios",
    "description": "/qa-scenarios 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/register",
    "title": "Register",
    "description": "/manager/register 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-partner/report-guide",
    "title": "Report Guide",
    "description": "/care-partner/report-guide 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/safety-protocol",
    "title": "Safety Protocol",
    "description": "/safety-protocol 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/signup",
    "title": "Signup",
    "description": "/signup 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/subscription",
    "title": "Subscription",
    "description": "/subscription 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/billing/success",
    "title": "Success",
    "description": "/billing/success 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/payments/success",
    "title": "Success",
    "description": "/payments/success 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/setup/supabase",
    "title": "Supabase",
    "description": "/setup/supabase 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/partner/tasks",
    "title": "Tasks",
    "description": "/partner/tasks 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/legal/terms",
    "title": "Terms",
    "description": "/legal/terms 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/terms",
    "title": "Terms",
    "description": "/terms 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/care-request/thanks",
    "title": "Thanks",
    "description": "/care-request/thanks 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/today",
    "title": "Today",
    "description": "/manager/today 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/trust",
    "title": "Trust",
    "description": "/trust 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/login/phone/verify",
    "title": "Verify",
    "description": "/login/phone/verify 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/verify",
    "title": "Verify",
    "description": "/manager/verify 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/manager/vetting",
    "title": "Vetting",
    "description": "/manager/vetting 경로로 이동합니다.",
    "category": "기타 전체 경로",
    "roles": [
      "all"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/parent/consent",
    "title": "Consent",
    "description": "/parent/consent 경로로 이동합니다.",
    "category": "부모님 기타",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/parent/convenience",
    "title": "Convenience",
    "description": "/parent/convenience 경로로 이동합니다.",
    "category": "부모님 기타",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/parent/install",
    "title": "Install",
    "description": "/parent/install 경로로 이동합니다.",
    "category": "부모님 기타",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/parent/login",
    "title": "Login",
    "description": "/parent/login 경로로 이동합니다.",
    "category": "부모님 기타",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/parent/today",
    "title": "Today",
    "description": "/parent/today 경로로 이동합니다.",
    "category": "부모님 기타",
    "roles": [
      "all",
      "parent"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/ops/anbu-control",
    "title": "Anbu Control",
    "description": "/ops/anbu-control 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/assignments",
    "title": "Assignments",
    "description": "/ops/assignments 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/audit",
    "title": "Audit",
    "description": "/ops/audit 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/automation",
    "title": "Automation",
    "description": "/ops/automation 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/care-cases",
    "title": "Care Cases",
    "description": "/ops/care-cases 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/care-passport",
    "title": "Care Passport",
    "description": "/ops/care-passport 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/care-reports-review",
    "title": "Care Reports Review",
    "description": "/ops/care-reports-review 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/care-requests",
    "title": "Care Requests",
    "description": "/ops/care-requests 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/cases",
    "title": "Cases",
    "description": "/ops/cases 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/command-center",
    "title": "Command Center",
    "description": "/ops/command-center 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/contact-center",
    "title": "Contact Center",
    "description": "/ops/contact-center 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/convenience",
    "title": "Convenience",
    "description": "/ops/convenience 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/costs",
    "title": "Costs",
    "description": "/ops/costs 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/crm",
    "title": "Crm",
    "description": "/ops/crm 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/cron-health",
    "title": "Cron Health",
    "description": "/ops/cron-health 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/daily-care",
    "title": "Daily Care",
    "description": "/ops/daily-care 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/dashboard",
    "title": "Dashboard",
    "description": "/ops/dashboard 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/demo-scenario",
    "title": "Demo Scenario",
    "description": "/ops/demo-scenario 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/discharge",
    "title": "Discharge",
    "description": "/ops/discharge 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/documents",
    "title": "Documents",
    "description": "/ops/documents 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/families",
    "title": "Families",
    "description": "/ops/families 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/files",
    "title": "Files",
    "description": "/ops/files 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/flow-qa",
    "title": "Flow Qa",
    "description": "/ops/flow-qa 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/intake",
    "title": "Intake",
    "description": "/ops/intake 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/intake-inbox",
    "title": "Intake Inbox",
    "description": "/ops/intake-inbox 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/integrations",
    "title": "Integrations",
    "description": "/ops/integrations 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/kakao-templates",
    "title": "Kakao Templates",
    "description": "/ops/kakao-templates 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/login",
    "title": "Login",
    "description": "/ops/login 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/manager-field",
    "title": "Manager Field",
    "description": "/ops/manager-field 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/manager-matching",
    "title": "Manager Matching",
    "description": "/ops/manager-matching 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/manager-offers",
    "title": "Manager Offers",
    "description": "/ops/manager-offers 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/manager-verification",
    "title": "Manager Verification",
    "description": "/ops/manager-verification 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/manager-vetting",
    "title": "Manager Vetting",
    "description": "/ops/manager-vetting 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/managers",
    "title": "Managers",
    "description": "/ops/managers 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/matching",
    "title": "Matching",
    "description": "/ops/matching 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/meals",
    "title": "Meals",
    "description": "/ops/meals 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/metrics",
    "title": "Metrics",
    "description": "/ops/metrics 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/notifications",
    "title": "Notifications",
    "description": "/ops/notifications 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/outbox",
    "title": "Outbox",
    "description": "/ops/outbox 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/outcomes",
    "title": "Outcomes",
    "description": "/ops/outcomes 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/outreach-crm",
    "title": "Outreach Crm",
    "description": "/ops/outreach-crm 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/partner-db",
    "title": "Partner Db",
    "description": "/ops/partner-db 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/partners",
    "title": "Partners",
    "description": "/ops/partners 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/pilot",
    "title": "Pilot",
    "description": "/ops/pilot 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/plan-builder",
    "title": "Plan Builder",
    "description": "/ops/plan-builder 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/qa",
    "title": "Qa",
    "description": "/ops/qa 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/reports",
    "title": "Reports",
    "description": "/ops/reports 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/risk-action",
    "title": "Risk Action",
    "description": "/ops/risk-action 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/risks",
    "title": "Risks",
    "description": "/ops/risks 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/routines",
    "title": "Routines",
    "description": "/ops/routines 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/safety",
    "title": "Safety",
    "description": "/ops/safety 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/social-care",
    "title": "Social Care",
    "description": "/ops/social-care 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/subscriptions",
    "title": "Subscriptions",
    "description": "/ops/subscriptions 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/tasks",
    "title": "Tasks",
    "description": "/ops/tasks 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/technology",
    "title": "Technology",
    "description": "/ops/technology 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/today",
    "title": "Today",
    "description": "/ops/today 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/ops/worry-center",
    "title": "Worry Center",
    "description": "/ops/worry-center 경로로 이동합니다.",
    "category": "운영실 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/child/assignments",
    "title": "Assignments",
    "description": "/child/assignments 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/care-reports",
    "title": "Care Reports",
    "description": "/child/care-reports 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/cases",
    "title": "Cases",
    "description": "/child/cases 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child",
    "title": "Child",
    "description": "/child 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/convenience",
    "title": "Convenience",
    "description": "/child/convenience 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/costs",
    "title": "Costs",
    "description": "/child/costs 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/daily-care",
    "title": "Daily Care",
    "description": "/child/daily-care 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/discharge",
    "title": "Discharge",
    "description": "/child/discharge 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/documents",
    "title": "Documents",
    "description": "/child/documents 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/family",
    "title": "Family",
    "description": "/child/family 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/family-code",
    "title": "Family Code",
    "description": "/family-code 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/files",
    "title": "Files",
    "description": "/child/files 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/intake-inbox",
    "title": "Intake Inbox",
    "description": "/child/intake-inbox 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/family/invite",
    "title": "Invite",
    "description": "/family/invite 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/family/join",
    "title": "Join",
    "description": "/family/join 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/manager-evaluations",
    "title": "Manager Evaluations",
    "description": "/child/manager-evaluations 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/matching",
    "title": "Matching",
    "description": "/child/matching 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/meals",
    "title": "Meals",
    "description": "/child/meals 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/appointments/new",
    "title": "New",
    "description": "/child/appointments/new 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/notifications",
    "title": "Notifications",
    "description": "/child/notifications 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/report",
    "title": "Report",
    "description": "/child/report 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/reports",
    "title": "Reports",
    "description": "/child/reports 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/routines",
    "title": "Routines",
    "description": "/child/routines 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/safety-loop",
    "title": "Safety Loop",
    "description": "/child/safety-loop 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/social-care",
    "title": "Social Care",
    "description": "/child/social-care 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/summaries",
    "title": "Summaries",
    "description": "/child/summaries 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/tasks",
    "title": "Tasks",
    "description": "/child/tasks 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/today",
    "title": "Today",
    "description": "/child/today 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/weekly-report",
    "title": "Weekly Report",
    "description": "/child/weekly-report 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/child/worry",
    "title": "Worry",
    "description": "/child/worry 경로로 이동합니다.",
    "category": "자녀·보호자 기타",
    "roles": [
      "all",
      "child"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": false
  },
  {
    "href": "/gov/audit",
    "title": "Audit",
    "description": "/gov/audit 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/gov/cases",
    "title": "Cases",
    "description": "/gov/cases 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/gov/compliance",
    "title": "Compliance",
    "description": "/gov/compliance 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/gov/dashboard",
    "title": "Dashboard",
    "description": "/gov/dashboard 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/gov/export",
    "title": "Export",
    "description": "/gov/export 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/gov",
    "title": "Gov",
    "description": "/gov 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/gov/iot",
    "title": "Iot",
    "description": "/gov/iot 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/gov/proposal",
    "title": "Proposal",
    "description": "/gov/proposal 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/gov/recipients",
    "title": "Recipients",
    "description": "/gov/recipients 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/gov/reports",
    "title": "Reports",
    "description": "/gov/reports 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  },
  {
    "href": "/gov/submission",
    "title": "Submission",
    "description": "/gov/submission 경로로 이동합니다.",
    "category": "정부·지자체 기타",
    "roles": [
      "all",
      "ops"
    ],
    "badge": "경로",
    "priority": 900,
    "opsOnly": true
  }
] as MenuLink[]

export function linksForRole(role: PortalRole): MenuLink[] {
  const filtered = role === 'all'
    ? menuLinks
    : menuLinks.filter((link) => link.roles.includes(role) || link.roles.includes('all'))

  return [...filtered].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.title.localeCompare(b.title)
  })
}
