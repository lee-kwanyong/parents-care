import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Role = 'parent' | 'child' | 'manager' | 'ops'

const roleHome: Record<Role, string> = {
  parent: '/parent/today',
  child: '/care-request',
  manager: '/manager',
  ops: '/ops'
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isRole(value: string): value is Role {
  return ['parent', 'child', 'manager', 'ops'].includes(value)
}

function getCodeForRole(role: Role) {
  const defaults: Record<Role, string> = {
    parent: 'parent2580',
    child: 'child2580',
    manager: 'manager2580',
    ops: 'ops2580'
  }

  const envMap: Record<Role, string | undefined> = {
    parent: process.env.PARENTS_CARE_PARENT_CODE,
    child: process.env.PARENTS_CARE_CHILD_CODE,
    manager: process.env.PARENTS_CARE_MANAGER_CODE,
    ops: process.env.PARENTS_CARE_OPS_CODE
  }

  return envMap[role] || defaults[role]
}

function setCookies(response: NextResponse, role: Role) {
  const options = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  }

  response.cookies.set('pc_access', 'ok', options)
  response.cookies.set('pc_role', role, options)
}

function clearCookies(response: NextResponse) {
  response.cookies.set('pc_access', '', { path: '/', maxAge: 0 })
  response.cookies.set('pc_role', '', { path: '/', maxAge: 0 })
}

export async function GET(request: NextRequest) {
  const access = request.cookies.get('pc_access')?.value || ''
  const role = request.cookies.get('pc_role')?.value || ''

  if (access !== 'ok' || !isRole(role)) {
    return NextResponse.json({
      ok: true,
      loggedIn: false,
      role: null,
      home: null
    })
  }

  return NextResponse.json({
    ok: true,
    loggedIn: true,
    role,
    home: roleHome[role]
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'logout') {
    const response = NextResponse.json({
      ok: true,
      message: '로그아웃했습니다.'
    })

    clearCookies(response)
    return response
  }

  const role = text(body.role)
  const code = text(body.code)

  if (!isRole(role)) {
    return NextResponse.json(
      {
        ok: false,
        message: '역할을 선택해주세요.'
      },
      { status: 400 }
    )
  }

  if (code !== getCodeForRole(role)) {
    return NextResponse.json(
      {
        ok: false,
        message: '접속 코드가 맞지 않습니다.'
      },
      { status: 401 }
    )
  }

  const response = NextResponse.json({
    ok: true,
    message: '접속되었습니다.',
    role,
    home: roleHome[role]
  })

  setCookies(response, role)
  return response
}
