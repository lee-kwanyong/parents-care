import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ''
  const token = text(request.nextUrl.searchParams.get('token'))
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')

  if (secret && (token === secret || auth === secret)) return true

  const ua = text(request.headers.get('user-agent')).toLowerCase()
  return !secret && ua.includes('vercel-cron')
}

function kstHour() {
  const date = new Date()
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      hour12: false
    }).format(date)
  )
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Cron 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const secret = process.env.CRON_SECRET || process.env.OPS_AUTOPILOT_SECRET || process.env.RESPONSE_ESCALATION_SECRET || ''
  const includeDaily = request.nextUrl.searchParams.get('includeDaily') === 'true' || kstHour() === 9

  const response = await fetch(new URL('/api/message-automation', request.nextUrl.origin), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: secret ? 'Bearer ' + secret : ''
    },
    body: JSON.stringify({
      action: 'runSituations',
      runType: 'cron',
      includeDaily,
      createdBy: 'Vercel Cron'
    }),
    cache: 'no-store'
  })

  const data = await response.json().catch(() => ({}))

  return NextResponse.json(
    {
      ok: response.ok,
      includeDaily,
      data
    },
    { status: response.ok ? 200 : response.status }
  )
}
