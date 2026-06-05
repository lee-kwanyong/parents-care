import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function secrets() {
  return [
    process.env.CRON_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || '',
    process.env.RESPONSE_ESCALATION_SECRET || ''
  ].filter(Boolean)
}

function authorized(request: NextRequest) {
  const queryToken = text(request.nextUrl.searchParams.get('token'))
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')
  const token = auth || queryToken

  return Boolean(token && secrets().includes(token))
}

function internalSecret() {
  return process.env.CRON_SECRET || process.env.OPS_AUTOPILOT_SECRET || process.env.RESPONSE_ESCALATION_SECRET || ''
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

  const secret = internalSecret()
  const url = new URL('/api/ops-heartbeat', request.nextUrl.origin)
  url.searchParams.set('action', 'run')
  url.searchParams.set('source', 'cron')
  url.searchParams.set('autoSend', process.env.OPS_HEARTBEAT_AUTO_SEND === 'true' ? 'true' : 'false')

  if (secret) url.searchParams.set('token', secret)

  const startedAt = new Date().toISOString()

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: secret ? 'Bearer ' + secret : '',
        'user-agent': 'anbuworks-ops-heartbeat-cron/1.0'
      }
    })

    const raw = await response.text()
    let data: unknown = raw

    try {
      data = raw ? JSON.parse(raw) : null
    } catch {
      data = raw
    }

    return NextResponse.json(
      {
        ok: response.ok,
        cron: 'ops-heartbeat',
        startedAt,
        finishedAt: new Date().toISOString(),
        upstreamStatus: response.status,
        data
      },
      { status: response.ok ? 200 : response.status }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        cron: 'ops-heartbeat',
        startedAt,
        finishedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Cron 실행 중 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}
