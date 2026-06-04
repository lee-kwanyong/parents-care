import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { SolapiMessageService } from 'solapi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

type Row = Record<string, unknown>

const OPS_COOKIE_NAME = 'anbu_ops_token'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || ''
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
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

function isOpsAuthed(request: NextRequest) {
  const configuredPassword = opsPassword()
  const token = request.cookies.get(OPS_COOKIE_NAME)?.value || ''

  if (!configuredPassword || !token) return false

  try {
    return safeEqual(token, tokenFor(configuredPassword))
  } catch {
    return false
  }
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://parents-care.net').replace(/\/$/, '')
}

function solapiConfig() {
  return {
    apiKey: process.env.SOLAPI_API_KEY || process.env.SOLAPI_KEY || '',
    apiSecret: process.env.SOLAPI_API_SECRET || process.env.SOLAPI_SECRET || '',
    sender: phone(process.env.SOLAPI_SENDER || process.env.SOLAPI_FROM || '')
  }
}

function configured() {
  const cfg = solapiConfig()
  return Boolean(cfg.apiKey && cfg.apiSecret && cfg.sender)
}

async function rest(path: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: 'Supabase 환경변수가 없습니다.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  })

  const raw = await response.text()
  let parsed: unknown = null

  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = raw
  }

  return {
    ok: response.ok,
    status: response.status,
    data: parsed,
    error: response.ok ? null : parsed || raw
  }
}

function rows(result: RestResult): Row[] {
  return result.ok && Array.isArray(result.data) ? result.data as Row[] : []
}

function statusMetrics(items: Row[]) {
  return {
    total: items.length,
    queued: items.filter((item) => text(item.status) === 'queued').length,
    sent: items.filter((item) => text(item.status) === 'sent').length,
    failed: items.filter((item) => text(item.status) === 'failed').length,
    outboxOnly: items.filter((item) => text(item.status) === 'outbox-only').length
  }
}

function requestTypeLabel(type: string) {
  if (type === 'meal_delivery') return '식사 연결'
  if (type === 'medication_reminder') return '복약 확인'
  if (type === 'urgent_neighbor_help') return '긴급 도움'
  if (type === 'care_partner_check') return '돌봄 확인'
  if (type === 'pharmacy_call') return '약국 상담'
  return '안부 확인'
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function makeProviderToken() {
  return randomBytes(24).toString('base64url')
}

function rowPayload(row: Row): Row {
  const payload = row.payload
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) return payload as Row
  return {}
}

function resultGroupId(result: unknown) {
  const data = result as Record<string, unknown>
  const groupInfo = data?.groupInfo as Record<string, unknown> | undefined
  return text(groupInfo?.groupId || data?.groupId || data?._id)
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

async function patchOutbox(id: string, patch: Row) {
  return rest('notification_outbox?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })
}

async function createProviderRequestToken(row: Row) {
  const payload = rowPayload(row)
  const requestId = text(payload.requestId)
  const providerId = text(payload.providerId)

  if (!requestId || !providerId) {
    return ''
  }

  const matchResult = await rest(
    'care_response_matches?select=*&request_id=eq.' +
      encodeURIComponent(requestId) +
      '&provider_id=eq.' +
      encodeURIComponent(providerId) +
      '&limit=1'
  )

  const match = rows(matchResult)[0]
  const matchId = text(match?.id)

  const rawToken = makeProviderToken()
  const tokenHash = hashToken(rawToken)

  await rest('care_response_access_tokens', {
    method: 'POST',
    body: JSON.stringify([
      {
        token_hash: tokenHash,
        request_id: requestId,
        provider_id: providerId,
        match_id: matchId || null,
        purpose: 'provider_request',
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        payload: {
          outboxId: text(row.id),
          reason: text(row.reason)
        }
      }
    ])
  })

  return `${siteUrl()}/provider/requests?t=${encodeURIComponent(rawToken)}`
}

async function buildProviderRequestLink(row: Row) {
  if (text(row.reason) === 'care-response-dispatch') {
    const tokenLink = await createProviderRequestToken(row)
    if (tokenLink) return tokenLink
  }

  const toPhone = phone(row.to_phone)
  return `${siteUrl()}/provider/requests${toPhone ? '?phone=' + encodeURIComponent(toPhone) : ''}`
}

async function buildSmsText(row: Row) {
  const title = text(row.title) || '[안부웍스] 알림'
  const body = text(row.body)
  const reason = text(row.reason)
  const targetUrl = text(row.target_url)

  if (reason === 'care-response-dispatch') {
    const link = await buildProviderRequestLink(row)
    const lines = [
      '[안부웍스] 지역 후속조치 요청',
      body.replace(/https?:\/\/\S+/g, '').trim(),
      '',
      '요청 확인:',
      link,
      '',
      '수락 전에는 상세 개인정보가 제한됩니다.',
      '응급상황이 의심되면 119 또는 의료기관에 연락하세요.'
    ].filter(Boolean)

    return lines.join('\n').slice(0, 1500)
  }

  const link = targetUrl
    ? targetUrl.startsWith('http')
      ? targetUrl
      : siteUrl() + targetUrl
    : ''

  return [title, body, link].filter(Boolean).join('\n').slice(0, 1500)
}

async function sendOne(row: Row) {
  const id = text(row.id)
  const toPhone = phone(row.to_phone)

  if (!id) {
    return { ok: false, id, message: '알림 ID가 없습니다.' }
  }

  if (!toPhone) {
    await patchOutbox(id, {
      status: 'failed',
      provider: 'validation',
      payload: {
        original: row,
        dispatchResult: {
          ok: false,
          error: '수신번호가 없습니다.'
        }
      }
    })

    return { ok: false, id, message: '수신번호가 없습니다.' }
  }

  const smsText = await buildSmsText(row)
  const cfg = solapiConfig()

  if (!cfg.apiKey || !cfg.apiSecret || !cfg.sender) {
    await patchOutbox(id, {
      status: 'outbox-only',
      provider: 'outbox-only',
      payload: {
        original: row,
        dispatchResult: {
          ok: false,
          mode: 'outbox-only',
          error: 'SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER 환경변수가 필요합니다.',
          textPreview: smsText.replace(/t=[^&\s]+/g, 't=***')
        }
      }
    })

    return {
      ok: false,
      id,
      message: 'SOLAPI 환경변수가 없어 outbox-only로 처리했습니다.'
    }
  }

  try {
    const messageService = new SolapiMessageService(cfg.apiKey, cfg.apiSecret)

    const result = await messageService.send({
      to: toPhone,
      from: cfg.sender,
      text: smsText
    })

    const groupId = resultGroupId(result)

    await patchOutbox(id, {
      status: 'sent',
      provider: 'solapi-sms',
      provider_message_id: groupId || null,
      sent_at: new Date().toISOString(),
      payload: {
        original: row,
        dispatchResult: {
          ok: true,
          mode: 'solapi-sms',
          data: result,
          textPreview: smsText.replace(/t=[^&\s]+/g, 't=***')
        }
      }
    })

    return {
      ok: true,
      id,
      message: '발송 완료',
      providerMessageId: groupId
    }
  } catch (error) {
    await patchOutbox(id, {
      status: 'failed',
      provider: 'solapi-sms',
      payload: {
        original: row,
        dispatchResult: {
          ok: false,
          mode: 'solapi-sms',
          error: errorMessage(error),
          textPreview: smsText.replace(/t=[^&\s]+/g, 't=***')
        }
      }
    })

    return {
      ok: false,
      id,
      message: errorMessage(error)
    }
  }
}

export async function GET(request: NextRequest) {
  if (!isOpsAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다. 먼저 /ops 에서 로그인해주세요.'
      },
      { status: 401 }
    )
  }

  const result = await rest('notification_outbox?select=*&order=created_at.desc&limit=200')

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '알림 발송함을 불러오지 못했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  const items = rows(result)

  return NextResponse.json({
    ok: true,
    configured: configured(),
    config: {
      hasApiKey: Boolean(solapiConfig().apiKey),
      hasApiSecret: Boolean(solapiConfig().apiSecret),
      hasSender: Boolean(solapiConfig().sender),
      senderMasked: solapiConfig().sender ? solapiConfig().sender.slice(0, 3) + '****' + solapiConfig().sender.slice(-4) : ''
    },
    items,
    metrics: statusMetrics(items)
  })
}

export async function POST(request: NextRequest) {
  if (!isOpsAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다. 먼저 /ops 에서 로그인해주세요.'
      },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'enqueueTest') {
    const toPhone = phone(body.toPhone)
    const toName = text(body.toName) || '테스트'
    const title = text(body.title) || '[안부웍스] 테스트 알림'
    const content = text(body.body) || '안부웍스 알림 발송 테스트입니다.'

    if (!toPhone) {
      return NextResponse.json(
        {
          ok: false,
          message: '테스트 수신번호가 필요합니다.'
        },
        { status: 400 }
      )
    }

    const result = await rest('notification_outbox', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          channel: 'sms',
          to_name: toName,
          to_phone: toPhone,
          title,
          body: content,
          reason: 'ops-notification-test',
          target_url: '/provider/requests',
          status: 'queued',
          provider: 'notification-dispatch-center',
          payload: {
            source: 'ops-test'
          }
        }
      ])
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '테스트 알림을 대기열에 넣지 못했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: '테스트 알림을 발송 대기열에 넣었습니다.',
      item: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (action === 'dispatchOne') {
    const id = text(body.id)

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: '알림 ID가 필요합니다.'
        },
        { status: 400 }
      )
    }

    const result = await rest('notification_outbox?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')

    if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: '알림을 찾지 못했습니다.',
          detail: result.error
        },
        { status: 404 }
      )
    }

    const dispatchResult = await sendOne(result.data[0] as Row)

    return NextResponse.json({
      ok: dispatchResult.ok,
      message: dispatchResult.message,
      result: dispatchResult
    })
  }

  if (action === 'dispatchQueued' || action === 'retryFailed') {
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 100)
    const status = action === 'retryFailed' ? 'failed' : 'queued'

    const result = await rest(
      'notification_outbox?select=*&status=eq.' +
        encodeURIComponent(status) +
        '&order=created_at.asc&limit=' +
        limit
    )

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '발송 대기 목록을 불러오지 못했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    const items = rows(result)
    const results = []

    for (const item of items) {
      results.push(await sendOne(item))
    }

    return NextResponse.json({
      ok: true,
      message: `${results.length}건 처리했습니다.`,
      results
    })
  }

  return NextResponse.json(
    {
      ok: false,
      message: '알 수 없는 action입니다.'
    },
    { status: 400 }
  )
}
