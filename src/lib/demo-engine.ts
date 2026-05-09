export type DemoRole = 'guardian' | 'family' | 'parent' | 'manager' | 'ops'

export type DemoStep = {
  order: number
  title: string
  description: string
  path: string
  role: DemoRole
  checkPoint: string
}

export const demoRoles: Array<{
  code: DemoRole
  label: string
  description: string
  homePath: string
}> = [
  {
    code: 'guardian',
    label: '보호자',
    description: '부모님 걱정 접수, 오늘의 안심판, 가족 할 일, 리포트 확인',
    homePath: '/child'
  },
  {
    code: 'family',
    label: '가족',
    description: '가족 공동조회와 가족 할 일 확인',
    homePath: '/child/family'
  },
  {
    code: 'parent',
    label: '부모님',
    description: '큰 글씨 화면에서 오늘 일정, 만남 암호, 자녀 전화 확인',
    homePath: '/parent/today'
  },
  {
    code: 'manager',
    label: '동행매니저',
    description: '오늘 배정, 현장 체크리스트, 리포트 초안 확인',
    homePath: '/manager'
  },
  {
    code: 'ops',
    label: '운영실',
    description: '접수함, 검증, 매칭, 배정, QA, 리포트 관리',
    homePath: '/ops'
  }
]

export const demoAccounts = [
  {
    role: 'guardian',
    email: 'guardian.demo@example.com',
    password: 'Demo1234!',
    label: '보호자 데모 계정'
  },
  {
    role: 'manager',
    email: 'manager.demo@example.com',
    password: 'Demo1234!',
    label: '매니저 데모 계정'
  },
  {
    role: 'ops',
    email: 'ops.demo@example.com',
    password: 'Demo1234!',
    label: '운영실 데모 계정'
  }
]

export const demoScenarioSteps: DemoStep[] = [
  {
    order: 1,
    title: '보호자 걱정 접수',
    description: '병원에 혼자 못 가세요를 선택하고 걱정을 맡깁니다.',
    path: '/care-request',
    role: 'guardian',
    checkPoint: '보호자가 무엇을 해야 할지 바로 이해하는지 확인'
  },
  {
    order: 2,
    title: '사진·카톡 접수',
    description: '예약 문자, 약 봉투, 영수증 사진 또는 카톡 내용을 올립니다.',
    path: '/care-intake',
    role: 'guardian',
    checkPoint: '앱 입력이 어려워도 사진·카톡으로 대체 가능한지 확인'
  },
  {
    order: 3,
    title: '운영실 접수 확인',
    description: '운영실이 간편 접수 내용을 확인하고 케어 요청으로 정리합니다.',
    path: '/ops/intake-inbox',
    role: 'ops',
    checkPoint: '운영자가 접수 내용을 보고 다음 행동을 이해하는지 확인'
  },
  {
    order: 4,
    title: '케어패스포트 입력',
    description: '오른쪽 귀, 오른쪽 다리, 알러지, 복용약, 식사 제한을 저장합니다.',
    path: '/care-passport',
    role: 'guardian',
    checkPoint: '현장 매니저에게 필요한 정보가 충분히 정리되는지 확인'
  },
  {
    order: 5,
    title: '매니저 지원',
    description: '동행케어 매니저가 지원서를 작성합니다.',
    path: '/manager/apply',
    role: 'manager',
    checkPoint: '지원자가 자격, 지역, 가능업무, 차량정책을 입력할 수 있는지 확인'
  },
  {
    order: 6,
    title: '매니저 본인확인·신분확인',
    description: '운영실이 휴대폰 본인확인, 신분 확인, 차량정책, 면접 확인을 등록합니다.',
    path: '/ops/manager-verification',
    role: 'ops',
    checkPoint: '검증 전 승인/배정이 막히는 구조인지 확인'
  },
  {
    order: 7,
    title: '매니저 승인·신뢰카드',
    description: '검증된 매니저를 승인하고 보호자에게 보여줄 신뢰카드를 생성합니다.',
    path: '/ops/managers',
    role: 'ops',
    checkPoint: '본인확인 완료 매니저만 신뢰카드가 생성되는지 확인'
  },
  {
    order: 8,
    title: '검증 매니저 매칭',
    description: '검증된 매니저 후보를 생성하고 선택한 뒤 현장 배정을 만듭니다.',
    path: '/ops/manager-matching',
    role: 'ops',
    checkPoint: '본인확인 완료 매니저만 후보로 나오는지 확인'
  },
  {
    order: 9,
    title: '부모님 큰 글씨 화면',
    description: '부모님이 오늘 일정, 만남 암호, 자녀 전화, 도움 요청을 확인합니다.',
    path: '/parent/today',
    role: 'parent',
    checkPoint: '부모님이 복잡한 조작 없이 이해할 수 있는지 확인'
  },
  {
    order: 10,
    title: '매니저 현장 체크',
    description: '매니저가 현장 체크리스트를 진행하고 리포트 초안을 작성합니다.',
    path: '/manager/today',
    role: 'manager',
    checkPoint: '현장 수행자가 꼭 필요한 것만 볼 수 있는지 확인'
  },
  {
    order: 11,
    title: '보호자 리포트 확인',
    description: '보호자가 30초 요약, 가족 할 일, 케이스 상태를 확인합니다.',
    path: '/child/cases',
    role: 'guardian',
    checkPoint: '보호자가 안심/확인 필요/다음 액션을 이해하는지 확인'
  },
  {
    order: 12,
    title: '매칭 후 평가',
    description: '보호자가 안전, 친절, 정확성, 시간준수를 평가합니다.',
    path: '/child/manager-evaluations',
    role: 'guardian',
    checkPoint: '평가가 매니저 안심도에 반영되는지 확인'
  }
]

export function labelDemoRole(role: string | null | undefined) {
  return demoRoles.find((item) => item.code === role)?.label || '미선택'
}

export function homePathForDemoRole(role: string | null | undefined) {
  return demoRoles.find((item) => item.code === role)?.homePath || '/demo-start'
}
