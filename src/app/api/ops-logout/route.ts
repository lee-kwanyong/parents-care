import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    message: '운영실 로그아웃이 완료되었습니다.'
  })

  response.cookies.delete('anbu_ops_session')

  return response
}

export async function GET() {
  const response = NextResponse.redirect(new URL('/ops/login', process.env.NEXT_PUBLIC_APP_URL || 'https://parents-care.net'))
  response.cookies.delete('anbu_ops_session')
  return response
}
