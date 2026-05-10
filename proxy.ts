import { NextRequest, NextResponse } from 'next/server'

const accessGuardEnabled = process.env.ACCESS_GUARD_ENABLED === 'true'
const demoGuardEnabled = process.env.DEMO_GUARD_ENABLED === 'true'

type Role = 'ops' | 'manager' | 'buyer' | 'guardian'

function roleFromCookie(request: NextRequest) {
  const accessRole = request.cookies.get('care_access_role')?.value || ''
  const demoRole = request.cookies.get('care_demo_role')?.value || ''

  return accessRole || demoRole
}

function isRole(role: string, allowed: Role[]) {
  return allowed.includes(role as Role)
}

function redirectToAccessLogin(request: NextRequest, reason: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/access-login'
  url.searchParams.set('next', request.nextUrl.pathname)
  url.searchParams.set('reason', reason)
  return NextResponse.redirect(url)
}

function jsonUnauthorized(reason: string) {
  return NextResponse.json(
    {
      ok: false,
      message: '보호된 API입니다. 입장 권한이 필요합니다.',
      reason
    },
    { status: 401 }
  )
}

function allowedRolesForPath(path: string): Role[] | null {
  if (path.startsWith('/ops')) return ['ops']
  if (path.startsWith('/api/ops')) return ['ops']

  if (path === '/buyer-demo' || path.startsWith('/buyer-demo')) return ['buyer', 'ops']
  if (path === '/demo-start' || path.startsWith('/demo-start')) return ['buyer', 'ops']
  if (path === '/demo-login' || path.startsWith('/demo-login')) return ['buyer', 'ops', 'manager', 'guardian']
  if (path === '/deploy-readiness' || path.startsWith('/deploy-readiness')) return ['buyer', 'ops']
  if (path === '/qa-scenarios' || path.startsWith('/qa-scenarios')) return ['buyer', 'ops']

  if (path.startsWith('/api/demo')) return ['buyer', 'ops']
  if (path.startsWith('/api/deploy-readiness')) return ['buyer', 'ops']
  if (path.startsWith('/api/qa-scenarios')) return ['buyer', 'ops']

  if (path === '/manager') return ['manager', 'ops']
  if (path.startsWith('/manager/today')) return ['manager', 'ops']
  if (path.startsWith('/manager/offers')) return ['manager', 'ops']
  if (path.startsWith('/manager/earnings')) return ['manager', 'ops']

  if (path.startsWith('/api/manager-mobile')) return ['manager', 'ops']
  if (path.startsWith('/api/manager-field-check')) return ['manager', 'ops']
  if (path.startsWith('/api/manager-offers')) return ['manager', 'ops']

  return null
}

export function proxy(request: NextRequest) {
  if (!accessGuardEnabled && !demoGuardEnabled) {
    return NextResponse.next()
  }

  const path = request.nextUrl.pathname

  if (
    path === '/access-login' ||
    path.startsWith('/api/access') ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.startsWith('/icons') ||
    path.startsWith('/clear-cache') ||
    path.startsWith('/clear-sw.html')
  ) {
    return NextResponse.next()
  }

  const allowed = allowedRolesForPath(path)

  if (!allowed) {
    return NextResponse.next()
  }

  const role = roleFromCookie(request)

  if (isRole(role, allowed)) {
    return NextResponse.next()
  }

  if (path.startsWith('/api/')) {
    return jsonUnauthorized('role-required')
  }

  return redirectToAccessLogin(request, 'role-required')
}

export const config = {
  matcher: [
    '/ops/:path*',
    '/api/ops/:path*',
    '/buyer-demo/:path*',
    '/buyer-demo',
    '/demo-start/:path*',
    '/demo-start',
    '/demo-login/:path*',
    '/demo-login',
    '/deploy-readiness/:path*',
    '/deploy-readiness',
    '/qa-scenarios/:path*',
    '/qa-scenarios',
    '/api/demo/:path*',
    '/api/deploy-readiness/:path*',
    '/api/qa-scenarios/:path*',
    '/manager',
    '/manager/today/:path*',
    '/manager/today',
    '/manager/offers/:path*',
    '/manager/offers',
    '/manager/earnings/:path*',
    '/manager/earnings',
    '/api/manager-mobile/:path*',
    '/api/manager-field-check/:path*',
    '/api/manager-offers/:path*'
  ]
}
