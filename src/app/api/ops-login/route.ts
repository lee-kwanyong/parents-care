import { NextRequest, NextResponse } from 'next/server'
import { recordAudit } from '@/lib/anbu-audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const accessCode = text(body.accessCode)
  const expectedCode = process.env.OPS_ACCESS_CODE || ''
  const sessionToken = process.env.OPS_SESSION_TOKEN || ''

  if (!expectedCode || !sessionToken) {
    await recordAudit(request, {
      actorRole: 'ops',
      actorName: 'unknown',
      action: 'ops_login_config_missing',
      status: 'failed',
      severity: 'critical',
      memo: '운영실 접근코드 환경변수가 설정되지 않았습니다.'
    })

    return NextResponse.json(
      {
        ok: false,
        message: '운영실 접근코드 환경변수가 설정되지 않았습니다.'
      },
      { status: 500 }
    )
  }

  if (accessCode !== expectedCode) {
    await recordAudit(request, {
      actorRole: 'ops',
      actorName: 'unknown',
      action: 'ops_login_failed',
      status: 'failed',
      severity: 'warning',
      memo: '잘못된 운영실 접근코드 입력',
      metadata: {
        inputLength: accessCode.length
      }
    })

    return NextResponse.json(
      {
        ok: false,
        message: '운영실 접근코드가 올바르지 않습니다.'
      },
      { status: 401 }
    )
  }

  await recordAudit(request, {
    actorRole: 'ops',
    actorName: '운영실',
    action: 'ops_login_success',
    status: 'ok',
    severity: 'info',
    memo: '운영실 로그인 성공'
  })

  const response = NextResponse.json({
    ok: true,
    message: '운영실 로그인이 완료되었습니다.'
  })

  response.cookies.set('anbu_ops_session', sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 12
  })

  return response
}
