export type PortalRole =
  | 'all'
  | 'parent'
  | 'guardian'
  | 'child'
  | 'provider'
  | 'care-worker'
  | 'careWorker'
  | 'ops'
  | 'admin'
  | string

export type MenuRole = PortalRole

export type MenuLink = {
  href: string
  title: string
  description: string
  category: string
  roles: PortalRole[]
  badge?: string
  priority?: number
  opsOnly?: boolean
}

export type RoleMetaEntry = {
  label: string
  title: string
  shortTitle: string
  description: string
  homeHref: string
  badge: string
}

function normalizeRole(role?: PortalRole): PortalRole {
  if (role === 'careWorker') return 'care-worker'
  return role || 'all'
}

export const customerMenuLinks: MenuLink[] = [
  {
    href: '/',
    title: '홈',
    description: '안부웍스 첫 화면입니다.',
    category: '공통',
    roles: ['all'],
    badge: '홈',
    priority: 1
  },
  {
    href: '/onboarding',
    title: '시작하기',
    description: '보호자와 부모님이 처음 서비스를 시작하는 안내입니다.',
    category: '공통',
    roles: ['all', 'guardian', 'child', 'parent'],
    badge: '시작',
    priority: 2
  },
  {
    href: '/consent',
    title: '실증 참여 동의',
    description: '실증 참여 및 비의료 고지를 확인합니다.',
    category: '공통',
    roles: ['all', 'guardian', 'child', 'parent'],
    badge: '동의',
    priority: 3
  },
  {
    href: '/mobile/parent',
    title: '부모님 안부 앱',
    description: '부모님이 오늘 안부를 직접 남깁니다.',
    category: '부모님',
    roles: ['all', 'parent'],
    badge: '부모님',
    priority: 4
  },
  {
    href: '/guardian/today',
    title: '보호자 오늘 리포트',
    description: '보호자가 오늘 상태와 안부를 확인합니다.',
    category: '보호자',
    roles: ['all', 'guardian', 'child'],
    badge: '리포트',
    priority: 5
  },
  {
    href: '/guardian/ring-report',
    title: '스마트링 안부리듬 리포트',
    description: '스마트링 기반 리포트를 확인합니다.',
    category: '보호자',
    roles: ['all', 'guardian', 'child'],
    badge: '스마트링',
    priority: 6
  },
  {
    href: '/guardian/proxy-checkin',
    title: '보호자 대리입력',
    description: '보호자가 전화 확인 후 상태를 대신 기록합니다.',
    category: '보호자',
    roles: ['all', 'guardian', 'child'],
    badge: '대리입력',
    priority: 7
  },
  {
    href: '/guide',
    title: '사용 가이드',
    description: '서비스 사용 방법을 확인합니다.',
    category: '가이드',
    roles: ['all'],
    badge: '가이드',
    priority: 8
  },
  {
    href: '/guide/guardian',
    title: '보호자 가이드',
    description: '보호자 전용 사용법입니다.',
    category: '가이드',
    roles: ['all', 'guardian', 'child'],
    badge: '보호자',
    priority: 9
  },
  {
    href: '/guide/parent',
    title: '부모님 가이드',
    description: '부모님 전용 사용법입니다.',
    category: '가이드',
    roles: ['all', 'parent'],
    badge: '부모님',
    priority: 10
  }
]

export const adminMenuLinks: MenuLink[] = [
  {
    href: '/admin/ops',
    title: '운영실 통합 허브',
    description: '운영, 지자체, R&D, 스마트링, 문자 관련 메뉴를 한곳에서 관리합니다.',
    category: '운영',
    roles: ['ops', 'admin'],
    badge: '허브',
    priority: 1,
    opsOnly: true
  },
  {
    href: '/admin/ops/today-runbook',
    title: '오늘 운영센터',
    description: '오늘 처리할 운영 항목을 봅니다.',
    category: '운영',
    roles: ['ops', 'admin'],
    badge: '오늘',
    priority: 2,
    opsOnly: true
  },
  {
    href: '/admin/ops/private-pilot',
    title: '자체 예비 실증',
    description: '실증 가구, 초대 링크, 신호 테스트를 관리합니다.',
    category: '운영',
    roles: ['ops', 'admin'],
    badge: '실증',
    priority: 3,
    opsOnly: true
  },
  {
    href: '/admin/ops/pilot-report',
    title: '실증 리포트',
    description: '실증 가구 및 보호자 리포트를 관리합니다.',
    category: '운영',
    roles: ['ops', 'admin'],
    badge: '리포트',
    priority: 4,
    opsOnly: true
  },
  {
    href: '/admin/ops/users',
    title: '가입자 관리',
    description: '가입자와 역할을 관리합니다.',
    category: '운영',
    roles: ['ops', 'admin'],
    badge: '유저',
    priority: 5,
    opsOnly: true
  },
  {
    href: '/admin/ops/ring-pilot-dashboard',
    title: '스마트링 실증 대시보드',
    description: '모델, 샘플, 가구 배정, 착용률, 데이터 품질, 배터리, 리포트 상태를 관리합니다.',
    category: '스마트링·R&D',
    roles: ['ops', 'admin'],
    badge: '실증',
    priority: 9,
    opsOnly: true
  },
  {
    href: '/admin/ops/ring-report-lab',
    title: '스마트링 리포트 실험실',
    description: '스마트링 기반 리포트를 생성합니다.',
    category: '스마트링·R&D',
    roles: ['ops', 'admin'],
    badge: '링리포트',
    priority: 10,
    opsOnly: true
  },
  {
    href: '/admin/ops/ring-csv-import',
    title: '스마트링 CSV 업로드',
    description: 'CSV를 업로드해 리포트를 생성합니다.',
    category: '스마트링·R&D',
    roles: ['ops', 'admin'],
    badge: 'CSV',
    priority: 11,
    opsOnly: true
  },
  {
    href: '/admin/ops/gov-rnd',
    title: '지자체·R&D 관리',
    description: '지자체, B2G, R&D, 바이오헬스 관련 화면을 관리합니다.',
    category: '지자체·R&D',
    roles: ['ops', 'admin'],
    badge: 'B2G/R&D',
    priority: 20,
    opsOnly: true
  },
  {
    href: '/admin/ops/proposal-reality-check',
    title: '제안 표현 점검',
    description: '의료표현, 과장표현, 책임표현을 점검합니다.',
    category: '지자체·R&D',
    roles: ['ops', 'admin'],
    badge: '표현점검',
    priority: 21,
    opsOnly: true
  },
  {
    href: '/admin/ops/consent-risk-center',
    title: '동의·책임범위 센터',
    description: '개인정보, 비의료 고지, 책임범위, 실증 동의를 관리합니다.',
    category: '지자체·R&D',
    roles: ['ops', 'admin'],
    badge: '동의',
    priority: 22,
    opsOnly: true
  },
  {
    href: '/admin/ops/message-automation',
    title: '상황별 자동문자',
    description: '상황별 문자 규칙과 내용을 관리합니다.',
    category: '문자·알림',
    roles: ['ops', 'admin'],
    badge: '자동문자',
    priority: 30,
    opsOnly: true
  },
  {
    href: '/admin/ops/notification-dispatch',
    title: '알림 발송센터',
    description: '알림 대기열과 발송 현황을 관리합니다.',
    category: '문자·알림',
    roles: ['ops', 'admin'],
    badge: '발송',
    priority: 31,
    opsOnly: true
  },
  {
    href: '/admin/ops/preflight-test',
    title: '전체 기능 테스트',
    description: '실증 전 핵심 기능을 점검합니다.',
    category: '시스템',
    roles: ['ops', 'admin'],
    badge: '테스트',
    priority: 40,
    opsOnly: true
  }
]

export const menuLinks = customerMenuLinks
export const publicMenuLinks = customerMenuLinks
export const developerMenuLinks = adminMenuLinks
export const allMenuLinks = [...customerMenuLinks, ...adminMenuLinks]

export const roleMeta: Record<string, RoleMetaEntry> = {
  all: {
    label: '전체',
    title: '전체 메뉴',
    shortTitle: '전체',
    description: '고객이 사용하는 전체 메뉴입니다.',
    homeHref: '/',
    badge: 'ALL'
  },
  parent: {
    label: '부모님',
    title: '부모님 메뉴',
    shortTitle: '부모님',
    description: '부모님이 직접 사용하는 메뉴입니다.',
    homeHref: '/mobile/parent',
    badge: '부모님'
  },
  guardian: {
    label: '보호자',
    title: '보호자 메뉴',
    shortTitle: '보호자',
    description: '보호자가 안부와 리포트를 확인하는 메뉴입니다.',
    homeHref: '/guardian/today',
    badge: '보호자'
  },
  child: {
    label: '자녀',
    title: '자녀/보호자 메뉴',
    shortTitle: '자녀',
    description: '자녀 보호자가 사용하는 메뉴입니다.',
    homeHref: '/guardian/today',
    badge: '자녀'
  },
  provider: {
    label: '파트너',
    title: '파트너 메뉴',
    shortTitle: '파트너',
    description: '파트너용 메뉴입니다.',
    homeHref: '/guide',
    badge: '파트너'
  },
  'care-worker': {
    label: '요양보호사',
    title: '요양보호사 메뉴',
    shortTitle: '요양',
    description: '요양보호사/생활지원사 메뉴입니다.',
    homeHref: '/guide',
    badge: '요양'
  },
  careWorker: {
    label: '요양보호사',
    title: '요양보호사 메뉴',
    shortTitle: '요양',
    description: '요양보호사/생활지원사 메뉴입니다.',
    homeHref: '/guide',
    badge: '요양'
  },
  ops: {
    label: '운영실',
    title: '운영실 메뉴',
    shortTitle: '운영실',
    description: '운영실 관리자 전용 메뉴입니다.',
    homeHref: '/admin/ops',
    badge: 'OPS'
  },
  admin: {
    label: 'Admin',
    title: 'Admin 메뉴',
    shortTitle: 'Admin',
    description: 'Admin 전용 메뉴입니다.',
    homeHref: '/admin/ops',
    badge: 'ADMIN'
  }
}

function customerLinksForRole(role?: PortalRole): MenuLink[] {
  const normalized = normalizeRole(role)

  if (!normalized || normalized === 'all') return customerMenuLinks
  if (normalized === 'ops' || normalized === 'admin') return []

  if (normalized === 'provider' || normalized === 'care-worker') {
    return customerMenuLinks.filter((link) => {
      return (
        link.roles.includes('all') ||
        link.roles.includes('provider') ||
        link.roles.includes('care-worker') ||
        link.roles.includes('careWorker')
      )
    })
  }

  return customerMenuLinks.filter((link) => {
    return link.roles.includes('all') || link.roles.includes(normalized)
  })
}

export function getMenuLinksForRole(
  role?: PortalRole,
  debugMode?: boolean
): MenuLink[] {
  const normalized = normalizeRole(role)

  if (normalized === 'ops' || normalized === 'admin') return adminMenuLinks
  if (debugMode) return [...customerMenuLinks, ...adminMenuLinks]

  return customerLinksForRole(normalized)
}

export function getAdminMenuLinks(): MenuLink[] {
  return adminMenuLinks
}

export function getPublicMenuLinks(): MenuLink[] {
  return customerMenuLinks
}

export type LinksForRoleCompat =
  ((role?: PortalRole, debugMode?: boolean) => MenuLink[]) &
  Record<string, MenuLink[]>

const linksForRoleFunction = ((
  role?: PortalRole,
  debugMode?: boolean
): MenuLink[] => {
  return getMenuLinksForRole(role, debugMode)
}) as unknown as LinksForRoleCompat

linksForRoleFunction.all = customerLinksForRole('all')
linksForRoleFunction.parent = customerLinksForRole('parent')
linksForRoleFunction.guardian = customerLinksForRole('guardian')
linksForRoleFunction.child = customerLinksForRole('child')
linksForRoleFunction.provider = customerLinksForRole('provider')
linksForRoleFunction['care-worker'] = customerLinksForRole('care-worker')
linksForRoleFunction.careWorker = customerLinksForRole('careWorker')
linksForRoleFunction.ops = adminMenuLinks
linksForRoleFunction.admin = adminMenuLinks

export const linksForRole: LinksForRoleCompat = linksForRoleFunction
