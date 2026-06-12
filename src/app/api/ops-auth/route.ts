import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

function clean(value: unknown) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 12)
}

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || process.env.ADMIN_CODE || '530868'
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || process.env.OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function tokenFor(password: string) {
  return createHash('sha256').update(password + ':' + authSecret()).digest('hex')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function isAuthed(request: NextRequest) {
  const password = opsPassword()
  if (!password) return false

  const expected = tokenFor(password)

  for (const name of COOKIE_NAMES) {
    const token = request.cookies.get(name)?.value || ''
    if (!token) continue

    try {
      if (safeEqual(token, expected)) return true
    } catch {
      continue
    }
  }

  return false
}

function setOpsCookies(response: NextResponse, value: string, maxAge: number) {
  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge
    })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    ok: true,
    configured: Boolean(opsPassword()),
    authenticated: isAuthed(request)
  })
}

export async function POST(request: NextRequest) {
  const password = opsPassword()

  if (!password) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        authenticated: false,
        message: '운영실 비밀번호 환경변수가 설정되지 않았습니다.'
      },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const input = clean(body.password)

  if (!input || !safeEqual(input, password)) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        authenticated: false,
        message: '운영실 비밀번호가 맞지 않습니다.'
      },
      { status: 401 }
    )
  }

  const response = NextResponse.json({
    ok: true,
    configured: true,
    authenticated: true,
    message: '운영실 인증이 완료되었습니다.'
  })

  setOpsCookies(response, tokenFor(password), 60 * 60 * 12)

  return response
}

export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    authenticated: false,
    message: '운영실 쿠키를 초기화했습니다.'
  })

  setOpsCookies(response, '', 0)

  return response
}
