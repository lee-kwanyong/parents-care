import { NextRequest, NextResponse } from 'next/server'

function isAdmin(request: NextRequest) {
  const role = request.cookies.get('pc_role')?.value || ''
  return role === 'admin'
}

function isApiPath(pathname: string) {
  return pathname.startsWith('/api/')
}

function adminRedirect(request: NextRequest) {
  const url = new URL('/admin', request.url)
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)

  return NextResponse.redirect(url)
}

function unauthorizedJson() {
  return NextResponse.json(
    {
      ok: false,
      message: '운영실 관리자 접속이 필요합니다.'
    },
    { status: 401 }
  )
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (isAdmin(request)) {
    return NextResponse.next()
  }

  if (isApiPath(pathname)) {
    return unauthorizedJson()
  }

  return adminRedirect(request)
}

export const config = {
  matcher: [
    '/ops/:path*',
    '/api/ops-dashboard/:path*',
    '/api/ops-intake/:path*',
    '/api/ops-notifications/:path*',
    '/api/manager-matching/:path*'
  ]
}
