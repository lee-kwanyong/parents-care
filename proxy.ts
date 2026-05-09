import { NextRequest, NextResponse } from 'next/server'

const demoGuardEnabled = process.env.DEMO_GUARD_ENABLED === 'true'

function redirectToDemoLogin(request: NextRequest, reason: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/demo-login'
  url.searchParams.set('next', request.nextUrl.pathname)
  url.searchParams.set('reason', reason)
  return NextResponse.redirect(url)
}

export function proxy(request: NextRequest) {
  if (!demoGuardEnabled) {
    return NextResponse.next()
  }

  const path = request.nextUrl.pathname
  const role = request.cookies.get('care_demo_role')?.value || ''

  if (path.startsWith('/ops')) {
    if (role !== 'ops') {
      return redirectToDemoLogin(request, 'ops-role-required')
    }
  }

  if (path.startsWith('/manager')) {
    if (role !== 'manager' && role !== 'ops') {
      return redirectToDemoLogin(request, 'manager-role-required')
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/ops/:path*', '/manager/:path*']
}
