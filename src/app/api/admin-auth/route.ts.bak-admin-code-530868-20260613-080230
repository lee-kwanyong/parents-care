import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ADMIN_CODE = '530868'

const COOKIE_NAMES = [
  'anbu_ops_token',
  'ops_session_token',
  'OPS_SESSION_TOKEN',
  'ops_session'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || process.env.OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function canonicalOpsCode() {
  return (
    text(process.env.ANBU_OPS_PASSWORD) ||
    text(process.env.OPS_PASSWORD) ||
    text(process.env.ADMIN_CODE) ||
    ADMIN_CODE
  )
}

function tokenFor(code: string) {
  return createHash('sha256').update(code + ':' + authSecret()).digest('hex')
}

export async function GET(request: NextRequest) {
  const validTokens = new Set([
    tokenFor(ADMIN_CODE),
    tokenFor(canonicalOpsCode()),
    ADMIN_CODE
  ])

  const cookieValues = [
    ...COOKIE_NAMES.map((name) => request.cookies.get(name)?.value || ''),
    request.cookies.get('anbu_admin_code_ok')?.value || ''
  ].filter(Boolean)

  const authed = cookieValues.some((value) => validTokens.has(value))

  return NextResponse.json({
    ok: true,
    authed
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const code = text(body.code)

  if (code !== ADMIN_CODE) {
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
    message: '운영실 인증이 완료되었습니다.',
    redirectTo: '/admin/ops'
  })

  const opsToken = tokenFor(canonicalOpsCode())

  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, opsToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    })
  }

  response.cookies.set('anbu_admin_code_ok', tokenFor(ADMIN_CODE), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    message: '운영실 로그아웃 완료'
  })

  for (const name of [...COOKIE_NAMES, 'anbu_admin_code_ok']) {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0
    })
  }

  return response
}
