import { NextRequest, NextResponse } from 'next/server'

function isAdmin(request: NextRequest) {
  const role = request.cookies.get('pc_role')?.value || ''
  return role === 'admin'
}

export function proxy(request: NextRequest) {
  if (isAdmin(request)) {
    return NextResponse.next()
  }

  return NextResponse.json(
    {
      ok: false,
      message: '운영실 관리자 접속이 필요합니다.'
    },
    { status: 401 }
  )
}

export const config = {
  matcher: [
    '/api/ops-dashboard/:path*',
    '/api/ops-intake/:path*',
    '/api/ops-notifications/:path*',
    '/api/manager-matching/:path*',
    '/api/manager-easy-vetting/:path*'
  ]
}
