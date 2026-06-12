import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ADMIN_CODE = '530868'

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'ops_session_token',
  'OPS_SESSION_TOKEN',
  'ops_session'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanCode(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || process.env.OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function canonicalOpsCode() {
  /*
    사용자는 530868만 입력합니다.
    단, 기존 운영실 API가 ANBU_OPS_PASSWORD/OPS_PASSWORD 기반 토큰을 검사할 수 있으므로
    쿠키는 서버 환경변수 기준 토큰으로 발급합니다.
  */
  return (
    text(process.env.ANBU_OPS_PASSWORD) ||
    text(process.env.OPS_PASSWORD) ||
    text(process.env.ADMIN_CODE) ||
    ADMIN_CODE
  )
}

function acceptedCodes() {
  return Array.from(
    new Set([
      ADMIN_CODE,
      text(process.env.ADMIN_CODE),
      text(process.env.ANBU_OPS_PASSWORD),
      text(process.env.OPS_PASSWORD)
    ].filter(Boolean))
  )
}

function tokenFor(code: string) {
  return createHash('sha256').update(code + ':' + authSecret()).digest('hex')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  if (left.length !== right.length) return false

  return timingSafeEqual(left, right)
}

function matches(a: string, b: string) {
  try {
    return safeEqual(a, b)
  } catch {
    return a === b
  }
}

function isAcceptedCode(code: string) {
  const clean = cleanCode(code)

  return acceptedCodes().some((allowed) => matches(clean, cleanCode(allowed)))
}

function hasValidCookie(request: NextRequest) {
  const validTokens = new Set([
    tokenFor(ADMIN_CODE),
    tokenFor(canonicalOpsCode()),
    ...acceptedCodes().map(tokenFor)
  ])

  const cookieValues = [
    ...OPS_COOKIE_NAMES.map((name) => request.cookies.get(name)?.value || ''),
    request.cookies.get('anbu_admin_code_ok')?.value || ''
  ].filter(Boolean)

  return cookieValues.some((cookie) => validTokens.has(cookie))
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    ok: true,
    authed: hasValidCookie(request),
    adminCodeReady: true
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const code = cleanCode(body.code)

  if (!isAcceptedCode(code)) {
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
  const adminToken = tokenFor(ADMIN_CODE)

  for (const name of OPS_COOKIE_NAMES) {
    response.cookies.set(name, opsToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    })
  }

  response.cookies.set('anbu_admin_code_ok', adminToken, {
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

  for (const name of [...OPS_COOKIE_NAMES, 'anbu_admin_code_ok']) {
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
