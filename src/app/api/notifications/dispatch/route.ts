import { createHash, randomUUID, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { SolapiMessageService } from 'solapi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

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

function isOpsAuthed(request: NextRequest) {
  const password = opsPassword()
  if (!password) return false

  const expected = tokenFor(password)

  for (const name of OPS_COOKIE_NAMES) {
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

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
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

function solapiReady() {
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

function metrics(items: Row[]) {
  return {
    total: items.length,
    queued: items.filter((item) => text(item.status) === 'queued').length,
    sent: items.filter((item) => text(item.status) === 'sent').length,
    failed: items.filter((item) => text(item.status) === 'failed').length,
    outboxOnly: items.filter((item) => text(item.status) === 'outbox-only').length
  }
}

function maskSender(sender: string) {
  if (!sender) return ''
  if (sender.length <= 7) return sender.slice(0, 3) + '****'
  return sender.slice(0, 3) + '****' + sender.slice(-4)
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function groupId(result: unknown) {
  const data = result as Record<string, unknown>
  const groupInfo = data.groupInfo as Record<string, unknown> | undefined
  return text(groupInfo?.groupId || groupInfo?._id || data.groupId || data._id)
}

function targetLink(row: Row) {
  const target = text(row.target_url)
  if (!target) return ''
  if (target.startsWith('http')) return target
  return siteUrl() + target
}

function buildSms(row: Row) {
  const title = text(row.title) || '[안부웍스] 알림'
  const body = text(row.body)
  const link = targetLink(row)

  return [title, body, link].filter(Boolean).join('\n').slice(0, 1500)
}

async function patchOutbox(id: string, patch: Row) {
  return rest('notification_outbox?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })
}

async function sendOne(row: Row) {
  const id = text(row.id)
  const toPhone = phone(row.to_phone)

  if (!id) {
    return {
      ok: false,
      id,
      message: '알림 ID가 없습니다.'
    }
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

    return {
      ok: false,
      id,
      message: '수신번호가 없습니다.'
    }
  }

  const cfg = solapiConfig()
  const smsText = buildSms(row)

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
          textPreview: smsText
        }
      }
    })

    return {
      ok: false,
      id,
      message: 'SOLAPI 환경변수가 없어 대기함만 저장했습니다.'
    }
  }

  try {
    const service = new SolapiMessageService(cfg.apiKey, cfg.apiSecret)
    const result = await service.send({
      to: toPhone,
      from: cfg.sender,
      text: smsText
    })

    await patchOutbox(id, {
      status: 'sent',
      provider: 'solapi-sms',
      provider_message_id: groupId(result) || null,
      sent_at: new Date().toISOString(),
      payload: {
        original: row,
        dispatchResult: {
          ok: true,
          mode: 'solapi-sms',
          data: result,
          textPreview: smsText
        }
      }
    })

    return {
      ok: true,
      id,
      message: '발송 완료',
      providerMessageId: groupId(result)
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
          textPreview: smsText
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

async function loadOutbox() {
  const result = await rest('notification_outbox?select=*&order=created_at.desc&limit=200')

  if (!result.ok) return result

  return {
    ok: true,
    status: 200,
    data: rows(result),
    error: null
  }
}

async function createTestOutbox(input: {
  toPhone: string
  toName: string
  body: string
  title?: string
}) {
  const toPhone = phone(input.toPhone)

  if (!toPhone) {
    return {
      ok: false,
      status: 400,
      data: null,
      error: '테스트 수신번호가 필요합니다.'
    }
  }

  const now = Date.now()
  const sourceKey = 'ops-test-' + now + '-' + randomUUID()

  return rest('notification_outbox', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        channel: 'sms',
        to_name: text(input.toName) || '테스트',
        to_phone: toPhone,
        title: text(input.title) || '[안부웍스] 테스트 문자',
        body: text(input.body) || '안부웍스 알림 발송 테스트입니다.',
        reason: 'ops-notification-test',
        target_url: '/ops/notification-dispatch',
        status: 'queued',
        provider: 'notification-dispatch-center',
        source_key: sourceKey,
        payload: {
          source: 'ops-test',
          createdFrom: '/ops/notification-dispatch'
        }
      }
    ])
  })
}

export async function GET(request: NextRequest) {
  if (!isOpsAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const result = await loadOutbox()

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

  const items = Array.isArray(result.data) ? result.data as Row[] : []

  return NextResponse.json({
    ok: true,
    configured: solapiReady(),
    config: {
      hasApiKey: Boolean(solapiConfig().apiKey),
      hasApiSecret: Boolean(solapiConfig().apiSecret),
      hasSender: Boolean(solapiConfig().sender),
      senderMasked: maskSender(solapiConfig().sender)
    },
    items,
    metrics: metrics(items)
  })
}

export async function POST(request: NextRequest) {
  if (!isOpsAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'enqueueTest' || action === 'enqueueAndSendTest') {
    const created = await createTestOutbox({
      toPhone: text(body.toPhone),
      toName: text(body.toName),
      body: text(body.body),
      title: text(body.title)
    })

    if (!created.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '테스트 문자를 대기열에 넣지 못했습니다.',
          detail: created.error
        },
        { status: created.status || 500 }
      )
    }

    const item = Array.isArray(created.data) ? created.data[0] as Row : created.data as Row

    if (action === 'enqueueAndSendTest') {
      const result = await sendOne(item)

      return NextResponse.json({
        ok: result.ok,
        message: result.message,
        item,
        result
      })
    }

    return NextResponse.json({
      ok: true,
      message: '테스트 문자를 대기열에 넣었습니다.',
      item
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
    const item = rows(result)[0]

    if (!item) {
      return NextResponse.json(
        {
          ok: false,
          message: '알림을 찾지 못했습니다.',
          detail: result.error
        },
        { status: 404 }
      )
    }

    const dispatchResult = await sendOne(item)

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
          message: '발송 대상 목록을 불러오지 못했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    const sendResults = []

    for (const item of rows(result)) {
      sendResults.push(await sendOne(item))
    }

    return NextResponse.json({
      ok: true,
      message: `${sendResults.length}건 처리했습니다.`,
      results: sendResults
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
