import { NextRequest, NextResponse } from 'next/server'

type Role = 'parent' | 'child' | 'manager' | 'ops'

function isApiPath(pathname: string) {
  return pathname.startsWith('/api/')
}

function loginRedirect(request: NextRequest, role: Role) {
  const url = new URL('/login', request.url)
  url.searchParams.set('role', role)
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)

  return NextResponse.redirect(url)
}

function unauthorizedJson(role: Role) {
  return NextResponse.json(
    {
      ok: false,
      message: `${role} 권한이 필요합니다.`
    },
    { status: 401 }
  )
}

function hasRole(request: NextRequest, allowed: Role[]) {
  const access = request.cookies.get('pc_access')?.value || ''
  const role = request.cookies.get('pc_role')?.value as Role | undefined

  if (access !== 'ok') return false
  if (!role) return false

  return allowed.includes(role)
}

function requireRole(request: NextRequest, allowed: Role[], loginRole: Role) {
  if (hasRole(request, allowed)) return NextResponse.next()

  if (isApiPath(request.nextUrl.pathname)) {
    return unauthorizedJson(loginRole)
  }

  return loginRedirect(request, loginRole)
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/manager/register') ||
    pathname.startsWith('/manager/apply') ||
    pathname.startsWith('/manager/vetting') ||
    pathname.startsWith('/manager/install')
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/parent/install')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/ops') || pathname.startsWith('/api/ops-')) {
    return requireRole(request, ['ops'], 'ops')
  }

  if (
    pathname.startsWith('/api/manager-matching') ||
    pathname.startsWith('/api/manager-easy-vetting')
  ) {
    return requireRole(request, ['ops'], 'ops')
  }

  if (
    pathname.startsWith('/manager') ||
    pathname.startsWith('/api/manager-mobile')
  ) {
    return requireRole(request, ['manager', 'ops'], 'manager')
  }

  if (
    pathname.startsWith('/child') ||
    pathname.startsWith('/api/guardian-reports')
  ) {
    return requireRole(request, ['child', 'ops'], 'child')
  }

  if (
    pathname.startsWith('/parent') ||
    pathname.startsWith('/api/parent-today')
  ) {
    return requireRole(request, ['parent', 'child', 'ops'], 'parent')
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/ops/:path*',
    '/manager/:path*',
    '/parent/:path*',
    '/child/:path*',
    '/api/ops-dashboard/:path*',
    '/api/ops-intake/:path*',
    '/api/manager-matching/:path*',
    '/api/manager-easy-vetting/:path*',
    '/api/manager-mobile/:path*',
    '/api/parent-today/:path*',
    '/api/guardian-reports/:path*'
  ]
}
