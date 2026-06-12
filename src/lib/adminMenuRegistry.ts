export type MenuRole = 'all' | 'parent' | 'guardian' | 'child' | 'provider' | 'ops' | 'admin' | string

export type MenuLink = {
  href: string
  title: string
  shortTitle?: string
  description: string
  category: string
  roles: MenuRole[]
  badge?: string
  priority?: number
  opsOnly?: boolean
}

/*
  고객 메뉴 원칙:
  - 고객이 직접 쓰는 화면만 노출합니다.
  - 운영실, 지자체, 실증, 관제, CSV, 어드민, B2G 관련 메뉴는 절대 public menuLinks에 넣지 않습니다.
*/
export const menuLinks: MenuLink[] = [
  {
    href: '/',
    title: '홈',
    description: '안부웍스 첫 화면입니다.',
    category: '고객',
    roles: ['all'],
    badge: '홈',
    priority: 1
  },
  {
    href: '/onboarding',
    title: '시작하기',
    description: '보호자와 부모님이 처음 서비스를 시작하는 안내입니다.',
    category: '고객',
    roles: ['all', 'guardian', 'child', 'parent'],
    badge: '시작',
    priority: 2
  },
  {
    href: '/consent',
    title: '실증 참여 동의',
    description: '개인정보 수집, 비의료 고지, 실증 참여 동의를 확인합니다.',
    category: '고객',
    roles: ['all', 'guardian', 'child', 'parent'],
    badge: '동의',
    priority: 3
  },
  {
    href: '/mobile/parent',
    title: '부모님 안부 앱',
    description: '부모님이 오늘 상태를 큰 버튼으로 남깁니다.',
    category: '부모님',
    roles: ['all', 'parent'],
    badge: '부모님',
    priority: 4
  },
  {
    href: '/guardian/today',
    title: '보호자 오늘 리포트',
    description: '보호자가 부모님의 오늘 안부를 확인합니다.',
    category: '보호자',
    roles: ['all', 'guardian', 'child'],
    badge: '리포트',
    priority: 5
  },
  {
    href: '/guardian/ring-report',
    title: '스마트링 안부리듬 리포트',
    description: '보호자가 부모님의 스마트링 안부리듬 리포트를 확인합니다.',
    category: '보호자',
    roles: ['all', 'guardian', 'child'],
    badge: '스마트링',
    priority: 6
  },
  {
    href: '/guardian/proxy-checkin',
    title: '보호자 대리입력',
    description: '보호자가 전화 확인 후 부모님 상태를 대신 기록합니다.',
    category: '보호자',
    roles: ['all', 'guardian', 'child'],
    badge: '대리입력',
    priority: 7
  },
  {
    href: '/guide',
    title: '사용 가이드',
    description: '안부웍스 사용법을 확인합니다.',
    category: '가이드',
    roles: ['all'],
    badge: '가이드',
    priority: 8
  },
  {
    href: '/guide/guardian',
    title: '보호자 가이드',
    description: '보호자가 리포트와 대리입력을 사용하는 방법입니다.',
    category: '가이드',
    roles: ['all', 'guardian', 'child'],
    badge: '보호자',
    priority: 9
  },
  {
    href: '/guide/parent',
    title: '부모님 가이드',
    description: '부모님이 안부 앱을 사용하는 방법입니다.',
    category: '가이드',
    roles: ['all', 'parent'],
    badge: '부모님',
    priority: 10
  }
]

export const publicMenuLinks: MenuLink[] = menuLinks
export const customerMenuLinks: MenuLink[] = menuLinks

export const adminMenuLinks: MenuLink[] = [
  {
    href: '/admin',
    title: 'Admin 로그인',
    description: '운영실 관리자 접속 화면입니다.',
    category: 'Admin',
    roles: ['ops', 'admin'],
    badge: 'Admin',
    priority: 1,
    opsOnly: true
  },
  {
    href: '/admin/ops',
    title: 'Admin 운영실',
    description: '오늘 실증 운영, 가입자, 리포트, 문자, 스마트링 데이터를 관리합니다.',
    category: 'Admin',
    roles: ['ops', 'admin'],
    badge: '운영실',
    priority: 2,
    opsOnly: true
  },
  {
    href: '/admin/ops/today-runbook',
    title: '오늘 실증 운영센터',
    description: '운영실 전용 오늘 할 일 센터입니다.',
    category: 'Admin',
    roles: ['ops', 'admin'],
    badge: '오늘',
    priority: 3,
    opsOnly: true
  },
  {
    href: '/admin/ops/ring-report-lab',
    title: '스마트링 리포트 실험실',
    description: '수동 입력으로 안부리듬 리포트를 생성합니다.',
    category: 'Admin',
    roles: ['ops', 'admin'],
    badge: '링리포트',
    priority: 4,
    opsOnly: true
  },
  {
    href: '/admin/ops/ring-csv-import',
    title: '스마트링 CSV 업로드',
    description: 'CSV로 안부리듬 리포트를 일괄 생성합니다.',
    category: 'Admin',
    roles: ['ops', 'admin'],
    badge: 'CSV',
    priority: 5,
    opsOnly: true
  },
  {
    href: '/admin/ops/pilot-report',
    title: '실증 리포트',
    description: '운영실 전용 실증 리포트입니다.',
    category: 'Admin',
    roles: ['ops', 'admin'],
    badge: '리포트',
    priority: 6,
    opsOnly: true
  },
  {
    href: '/admin/ops/message-automation',
    title: '상황별 자동문자',
    description: '운영실 전용 문자 자동화 센터입니다.',
    category: 'Admin',
    roles: ['ops', 'admin'],
    badge: '문자',
    priority: 7,
    opsOnly: true
  },
  {
    href: '/admin/ops/notification-dispatch',
    title: '알림 발송센터',
    description: '운영실 전용 알림 발송센터입니다.',
    category: 'Admin',
    roles: ['ops', 'admin'],
    badge: '발송',
    priority: 8,
    opsOnly: true
  }
]

export const allMenuLinks: MenuLink[] = [...menuLinks, ...adminMenuLinks]

export function getMenuLinksForRole(role?: MenuRole) {
  if (!role || role === 'all') return menuLinks

  return menuLinks.filter((link) =>
    link.roles.includes('all') || link.roles.includes(role)
  )
}

export function getAdminMenuLinks() {
  return adminMenuLinks
}

export function getPublicMenuLinks() {
  return menuLinks
}


/* __ANBU_COMPAT_EXPORTS_START__ */
/*
  Backward compatibility exports.

  기존 컴포넌트(AdminMenuHub, RolePortalMenu)가 기대하던 이름을 유지합니다.
  단, 고객 메뉴에는 menuLinks/customerMenuLinks만 노출하고,
  운영실·지자체·B2G·실증·CSV·admin 관련 링크는 adminMenuLinks/developerMenuLinks에만 둡니다.
*/

export type PortalRole =
  | 'all'
  | 'parent'
  | 'guardian'
  | 'child'
  | 'provider'
  | 'care-worker'
  | 'ops'
  | 'admin'
  | string

type RoleMetaEntry = {
  label: string
  title: string
  shortTitle: string
  name: string
  badge: string
  description: string
  href: string
  homeHref: string
  tone?: string
}

export const roleMeta: Record<string, RoleMetaEntry> = {
  all: {
    label: '전체',
    shortTitle: '전체',
    title: '전체 메뉴',
    name: '전체',
    badge: 'All',
    description: '고객이 사용할 수 있는 전체 메뉴입니다.',
    href: '/',
    homeHref: '/',
    tone: 'safe'
  },
  parent: {
    label: '부모님',
    shortTitle: '부모님',
    title: '부모님 메뉴',
    name: '부모님',
    badge: '부모님',
    description: '부모님이 직접 안부를 남기는 메뉴입니다.',
    href: '/mobile/parent',
    homeHref: '/mobile/parent',
    tone: 'safe'
  },
  guardian: {
    label: '보호자',
    shortTitle: '보호자',
    title: '보호자 메뉴',
    name: '보호자',
    badge: '보호자',
    description: '보호자가 부모님 안부와 리포트를 확인하는 메뉴입니다.',
    href: '/guardian/today',
    homeHref: '/guardian/today',
    tone: 'safe'
  },
  child: {
    label: '보호자',
    shortTitle: '보호자',
    title: '보호자 메뉴',
    name: '보호자',
    badge: '보호자',
    description: '자녀·보호자용 메뉴입니다.',
    href: '/guardian/today',
    homeHref: '/guardian/today',
    tone: 'safe'
  },
  provider: {
    label: '파트너',
    shortTitle: '파트너',
    title: '생활확인 파트너',
    name: '파트너',
    badge: '파트너',
    description: '생활확인 파트너용 고객 메뉴입니다.',
    href: '/guide/provider',
    homeHref: '/guide/provider',
    tone: 'warning'
  },
  'care-worker': {
    label: '파트너',
    shortTitle: '파트너',
    title: '생활확인 파트너',
    name: '파트너',
    badge: '파트너',
    description: '생활확인 파트너용 고객 메뉴입니다.',
    href: '/guide/provider',
    homeHref: '/guide/provider',
    tone: 'warning'
  },
  ops: {
    label: 'Admin',
    shortTitle: 'Admin',
    title: 'Admin 운영실',
    name: 'Admin',
    badge: 'Admin',
    description: '운영실 관리자 전용 메뉴입니다.',
    href: '/admin/ops',
    homeHref: '/admin/ops',
    tone: 'danger'
  },
  admin: {
    label: 'Admin',
    shortTitle: 'Admin',
    title: 'Admin 운영실',
    name: 'Admin',
    badge: 'Admin',
    description: '운영실 관리자 전용 메뉴입니다.',
    href: '/admin/ops',
    homeHref: '/admin/ops',
    tone: 'danger'
  }
}

function customerLinksForRole(role?: PortalRole): MenuLink[] {
  if (!role || role === 'all') return menuLinks

  if (role === 'ops' || role === 'admin') return []

  if (role === 'care-worker') {
    return menuLinks.filter((link) =>
      link.roles.includes('all') ||
      link.roles.includes('provider') ||
      link.roles.includes('care-worker')
    )
  }

  return menuLinks.filter((link) =>
    link.roles.includes('all') || link.roles.includes(role)
  )
}

/*
  linksForRole은 예전 코드 호환을 위해
  1) linksForRole(role, debugMode) 함수처럼도 쓸 수 있고
  2) linksForRole[role] 객체처럼도 쓸 수 있게 만듭니다.

  TypeScript가 함수+객체 혼합 타입을 바로 추론하지 못하므로 unknown 캐스팅 후 속성을 붙입니다.
*/
export type LinksForRoleCompat =
  ((role?: PortalRole, debugMode?: boolean) => MenuLink[]) &
  Record<string, MenuLink[]>

const linksForRoleFunction = ((
  role?: PortalRole,
  debugMode?: boolean
): MenuLink[] => {
  if (role === 'ops' || role === 'admin') return adminMenuLinks
  if (debugMode === true) return [...menuLinks, ...adminMenuLinks]

  return customerLinksForRole(role)
}) as unknown as LinksForRoleCompat

linksForRoleFunction.all = customerLinksForRole('all')
linksForRoleFunction.parent = customerLinksForRole('parent')
linksForRoleFunction.guardian = customerLinksForRole('guardian')
linksForRoleFunction.child = customerLinksForRole('child')
linksForRoleFunction.provider = customerLinksForRole('provider')
linksForRoleFunction['care-worker'] = customerLinksForRole('care-worker')
linksForRoleFunction.ops = adminMenuLinks
linksForRoleFunction.admin = adminMenuLinks

export const linksForRole: LinksForRoleCompat = linksForRoleFunction

/*
  개발자/운영실 메뉴는 고객 menuLinks와 분리합니다.
  고객 메뉴에서 import하는 menuLinks에는 절대 admin/ops/B2G/지자체 메뉴가 들어가지 않습니다.
*/
export const developerMenuLinks: MenuLink[] = adminMenuLinks

/* __ANBU_COMPAT_EXPORTS_END__ */

