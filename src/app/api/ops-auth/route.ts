import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const COOKIE_NAME = 'anbu_ops_token'

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || '530868'
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function tokenFor(password: string) {
  return createHash('sha256')
    .update(password + ':' + authSecret())
    .digest('hex')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  if (left.length !== right.length) return false

  return timingSafeEqual(left, right)
}

function isAuthed(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value || ''
  const expected = tokenFor(opsPassword())

  if (!token) return false

  try {
    return safeEqual(token, expected)
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    ok: true,
    authenticated: isAuthed(request)
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const password = String(body.password || '').replace(/[^\d]/g, '').slice(0, 12)
  const expected = opsPassword()

  if (!password || !safeEqual(password, expected)) {
    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        message: '운영실 비밀번호가 맞지 않습니다.'
      },
      { status: 401 }
    )
  }

  const response = NextResponse.json({
    ok: true,
    authenticated: true,
    message: '운영실 인증이 완료되었습니다.'
  })

  response.cookies.set(COOKIE_NAME, tokenFor(expected), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    authenticated: false,
    message: '운영실 로그아웃이 완료되었습니다.'
  })

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  })

  return response
}
