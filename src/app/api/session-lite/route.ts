import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Role = 'guardian' | 'parent' | 'manager' | 'admin'

const roleHome: Record<Role, string> = {
  guardian: '/care-request',
  parent: '/parent/today',
  manager: '/manager',
  admin: '/ops'
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isRole(value: string): value is Role {
  return ['guardian', 'parent', 'manager', 'admin'].includes(value)
}

function setSession(response: NextResponse, role: Role, name = '') {
  const options = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  }

  response.cookies.set('pc_role', role, options)
  response.cookies.set('pc_name', name || role, options)
}

function clearSession(response: NextResponse) {
  response.cookies.set('pc_role', '', { path: '/', maxAge: 0 })
  response.cookies.set('pc_name', '', { path: '/', maxAge: 0 })
}

export async function GET(request: NextRequest) {
  const role = request.cookies.get('pc_role')?.value || ''
  const name = request.cookies.get('pc_name')?.value || ''

  if (!isRole(role)) {
    return NextResponse.json({
      ok: true,
      loggedIn: false,
      role: null,
      name: '',
      home: null
    })
  }

  return NextResponse.json({
    ok: true,
    loggedIn: true,
    role,
    name,
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

    clearSession(response)
    return response
  }

  if (action === 'guardian_signup' || action === 'guardian_login') {
    const name = text(body.name) || '보호자'
    const phone = text(body.phone)

    if (!phone) {
      return NextResponse.json(
        {
          ok: false,
          message: '휴대폰 번호를 입력해주세요.'
        },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      ok: true,
      message: action === 'guardian_signup' ? '보호자 회원가입이 완료됐습니다.' : '보호자 로그인 완료',
      role: 'guardian',
      home: roleHome.guardian
    })

    setSession(response, 'guardian', name)
    return response
  }

  if (action === 'parent_code_login') {
    const code = text(body.code)

    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json(
        {
          ok: false,
          message: '부모님 접속코드 4자리를 입력해주세요.'
        },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      ok: true,
      message: '부모님 안심 화면으로 접속합니다.',
      role: 'parent',
      home: roleHome.parent
    })

    setSession(response, 'parent', '부모님')
    return response
  }

  if (action === 'manager_login') {
    const phone = text(body.phone)

    if (!phone) {
      return NextResponse.json(
        {
          ok: false,
          message: '케어파트너 휴대폰 번호를 입력해주세요.'
        },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      ok: true,
      message: '케어파트너 화면으로 이동합니다.',
      role: 'manager',
      home: roleHome.manager
    })

    setSession(response, 'manager', text(body.name) || '케어파트너')
    return response
  }

  if (action === 'admin_login') {
    const code = text(body.code)
    const adminCode = process.env.PARENTS_CARE_ADMIN_CODE || 'admin2580'

    if (code !== adminCode) {
      return NextResponse.json(
        {
          ok: false,
          message: '운영실 관리자 코드가 맞지 않습니다.'
        },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      ok: true,
      message: '운영실로 접속합니다.',
      role: 'admin',
      home: roleHome.admin
    })

    setSession(response, 'admin', '운영실')
    return response
  }

  return NextResponse.json(
    {
      ok: false,
      message: '올바른 요청이 아닙니다.'
    },
    { status: 400 }
  )
}
