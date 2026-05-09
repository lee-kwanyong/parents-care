import { NextRequest, NextResponse } from 'next/server'
import { demoRoles, type DemoRole } from '@/lib/demo-engine'

export const dynamic = 'force-dynamic'

const roleSet = new Set(demoRoles.map((role) => role.code))

export async function GET(request: NextRequest) {
  const role = request.cookies.get('care_demo_role')?.value || ''

  return NextResponse.json({
    ok: true,
    role: roleSet.has(role as DemoRole) ? role : null
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const role = typeof body.role === 'string' ? body.role.trim() : ''

  if (!roleSet.has(role as DemoRole)) {
    return NextResponse.json({ ok: false, message: '데모 역할이 올바르지 않습니다.' }, { status: 400 })
  }

  const response = NextResponse.json({
    ok: true,
    role
  })

  response.cookies.set('care_demo_role', role, {
    path: '/',
    maxAge: 60 * 60 * 8,
    sameSite: 'lax'
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    role: null
  })

  response.cookies.set('care_demo_role', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax'
  })

  return response
}
