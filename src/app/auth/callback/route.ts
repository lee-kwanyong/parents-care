import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  const current = new URL(request.url)
  const target = new URL('/auth/callback-client', current.origin)

  for (const [key, value] of current.searchParams.entries()) {
    target.searchParams.set(key, value)
  }

  if (!target.searchParams.get('next')) {
    target.searchParams.set('next', '/family-link')
  }

  return NextResponse.redirect(target)
}
