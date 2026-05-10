import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AccessRole = 'ops' | 'manager' | 'buyer' | 'guardian'

const roleLabels: Record<AccessRole, string> = {
  ops: '운영실',
  manager: '케어파트너',
  buyer: '바이어',
  guardian: '보호자'
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function expectedCode(role: AccessRole) {
  const map: Record<AccessRole, string> = {
    ops: process.env.OPS_ACCESS_CODE || 'ops-2580',
    manager: process.env.MANAGER_ACCESS_CODE || 'manager-2580',
    buyer: process.env.BUYER_ACCESS_CODE || 'buyer-2580',
    guardian: process.env.GUARDIAN_ACCESS_CODE || 'guardian-2580'
  }

  return map[role]
}

function validRole(value: string): value is AccessRole {
  return ['ops', 'manager', 'buyer', 'guardian'].includes(value)
}

export async function GET(request: NextRequest) {
  const role = request.cookies.get('care_access_role')?.value || ''

  return NextResponse.json({
    ok: true,
    role: validRole(role) ? role : null,
    roleLabel: validRole(role) ? roleLabels[role] : null,
    guardEnabled: process.env.ACCESS_GUARD_ENABLED === 'true'
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const roleValue = text(body.role)
  const code = text(body.code)

  if (!validRole(roleValue)) {
    return NextResponse.json(
      {
        ok: false,
        message: '입장 역할이 올바르지 않습니다.'
      },
      { status: 400 }
    )
  }

  if (code !== expectedCode(roleValue)) {
    return NextResponse.json(
      {
        ok: false,
        message: '입장 코드가 맞지 않습니다.'
      },
      { status: 401 }
    )
  }

  const response = NextResponse.json({
    ok: true,
    role: roleValue,
    roleLabel: roleLabels[roleValue],
    message: `${roleLabels[roleValue]} 권한으로 입장했습니다.`
  })

  response.cookies.set('care_access_role', roleValue, {
    path: '/',
    maxAge: 60 * 60 * 12,
    sameSite: 'lax'
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    message: '입장 권한을 초기화했습니다.'
  })

  response.cookies.set('care_access_role', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax'
  })

  return response
}
