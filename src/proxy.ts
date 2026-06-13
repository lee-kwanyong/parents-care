import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SESSION_VALUE = 'anbu-admin-ok-v1'

function withPath(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  return url
}

function isAdminAuthed(request: NextRequest) {
  return request.cookies.get('anbu_admin_code_ok')?.value === ADMIN_SESSION_VALUE
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin') {
    return NextResponse.next()
  }

  if (pathname === '/admin/ops') {
    if (!isAdminAuthed(request)) {
      return NextResponse.redirect(withPath(request, '/admin'))
    }

    return NextResponse.next()
  }

  if (pathname.startsWith('/admin/ops/')) {
    if (!isAdminAuthed(request)) {
      return NextResponse.redirect(withPath(request, '/admin'))
    }

    return NextResponse.rewrite(withPath(request, '/ops' + pathname.slice('/admin/ops'.length)))
  }

  if (pathname === '/portal/ops') {
    return NextResponse.redirect(withPath(request, '/admin/ops'))
  }

  if (pathname.startsWith('/portal/ops/')) {
    return NextResponse.redirect(withPath(request, '/admin/ops' + pathname.slice('/portal/ops'.length)))
  }

  if (pathname === '/ops') {
    return NextResponse.redirect(withPath(request, '/admin/ops'))
  }

  if (pathname.startsWith('/ops/')) {
    return NextResponse.redirect(withPath(request, '/admin/ops' + pathname.slice('/ops'.length)))
  }

  if (pathname === '/guide/ops') {
    return NextResponse.redirect(withPath(request, '/admin/ops/training-center'))
  }

  if (
    pathname.startsWith('/gov') ||
    pathname.startsWith('/b2g') ||
    pathname.startsWith('/municipal') ||
    pathname.startsWith('/public-office') ||
    pathname.startsWith('/rnd') ||
    pathname.startsWith('/r-and-d')
  ) {
    return NextResponse.redirect(withPath(request, '/admin/ops/gov-rnd'))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/ops',
    '/ops/:path*',
    '/portal/ops',
    '/portal/ops/:path*',
    '/guide/ops',
    '/gov/:path*',
    '/b2g/:path*',
    '/municipal/:path*',
    '/public-office/:path*',
    '/rnd/:path*',
    '/r-and-d/:path*'
  ]
}
