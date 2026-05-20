import { NextRequest, NextResponse } from 'next/server'

const protectedApiPrefixes = [
  '/api/ops-dashboard',
  '/api/ops-intake',
  '/api/ops-notifications',
  '/api/manager-matching',
  '/api/manager-easy-vetting'
]

function isAdmin(request: NextRequest) {
  const role = request.cookies.get('pc_role')?.value || ''
  return role === 'admin'
}

function isProtectedApi(pathname: string) {
  return protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix))
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // /admin 자체는 절대 막거나 리디렉트하지 않습니다.
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // 관리자 로그인 API도 절대 막지 않습니다.
  if (pathname.startsWith('/api/session-lite')) {
    return NextResponse.next()
  }

  // /ops 페이지는 리디렉트하지 않습니다.
  // 비관리자라면 src/app/ops/layout.tsx에서 로그인 화면을 보여줍니다.
  if (pathname.startsWith('/ops')) {
    return NextResponse.next()
  }

  // 운영실 관련 API만 관리자 쿠키가 없으면 차단합니다.
  if (isProtectedApi(pathname) && !isAdmin(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 관리자 접속이 필요합니다.'
      },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/ops/:path*',
    '/admin/:path*',
    '/api/session-lite/:path*',
    '/api/ops-dashboard/:path*',
    '/api/ops-intake/:path*',
    '/api/ops-notifications/:path*',
    '/api/manager-matching/:path*',
    '/api/manager-easy-vetting/:path*'
  ]
}
