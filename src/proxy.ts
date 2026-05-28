import { NextRequest, NextResponse } from 'next/server'

const OPS_COOKIE_NAME = 'anbu_ops_session'

function isProtectedOpsApi(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const scope = request.nextUrl.searchParams.get('scope') || ''

  if (pathname.startsWith('/api/anbu-ops/')) return true

  if (pathname === '/api/anbu-partners/list') return true
  if (pathname === '/api/anbu-partners/verify') return true
  if (pathname === '/api/anbu-matching/requests/list') return true

  if (pathname === '/api/anbu-care-reports/review') return true
  if (pathname === '/api/anbu-care-reports/quality-check') return true
  if (pathname === '/api/anbu-care-reports/list' && scope === 'ops') return true

  if (pathname === '/api/anbu-subscriptions/admin-activate') return true
  if (pathname === '/api/anbu-subscriptions/list') return true

  if (pathname === '/api/anbu-notifications/outbox') return true
  if (pathname === '/api/anbu-notifications/dispatch') return true

  return false
}

function isOpsPublicPath(pathname: string) {
  return (
    pathname === '/ops/login' ||
    pathname === '/api/ops-login' ||
    pathname === '/api/ops-logout'
  )
}

function isAuthed(request: NextRequest) {
  const expected = process.env.OPS_SESSION_TOKEN || ''
  const actual = request.cookies.get(OPS_COOKIE_NAME)?.value || ''

  return Boolean(expected && actual && actual === expected)
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (isOpsPublicPath(pathname)) {
    return NextResponse.next()
  }

  const needsOpsAuth =
    pathname.startsWith('/ops') ||
    isProtectedOpsApi(request)

  if (!needsOpsAuth) {
    return NextResponse.next()
  }

  if (isAuthed(request)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 로그인이 필요합니다.',
        loginUrl: '/ops/login'
      },
      { status: 401 }
    )
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/ops/login'
  loginUrl.searchParams.set('next', pathname)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/ops/:path*', '/api/:path*']
}
