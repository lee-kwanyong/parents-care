import { NextRequest, NextResponse } from 'next/server'
import { recordAudit } from '@/lib/anbu-audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  await recordAudit(request, {
    actorRole: 'ops',
    actorName: '운영실',
    action: 'ops_logout',
    status: 'ok',
    severity: 'info',
    memo: '운영실 로그아웃'
  })

  const response = NextResponse.json({
    ok: true,
    message: '운영실 로그아웃이 완료되었습니다.'
  })

  response.cookies.delete('anbu_ops_session')

  return response
}

export async function GET(request: NextRequest) {
  await recordAudit(request, {
    actorRole: 'ops',
    actorName: '운영실',
    action: 'ops_logout',
    status: 'ok',
    severity: 'info',
    memo: '운영실 로그아웃'
  })

  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://parents-care.net'
  const response = NextResponse.redirect(new URL('/ops/login', base))
  response.cookies.delete('anbu_ops_session')
  return response
}
