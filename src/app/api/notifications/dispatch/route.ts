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

type MessageTemplate = {
  code: string
  category: string
  title: string
  body: string
  default_target_url: string
  sort_order: number
  is_active: boolean
}

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

const FALLBACK_TEMPLATES: MessageTemplate[] = [
  {
    code: 'ops-test',
    category: '테스트',
    title: '[안부웍스] 테스트 문자',
    body: '안부웍스 알림 발송 테스트입니다.\n이 문자는 운영실 발송센터 점검용입니다.',
    default_target_url: '/ops/notification-dispatch',
    sort_order: 10,
    is_active: true
  },
  {
    code: 'provider-urgent-help',
    category: '지역 도움망',
    title: '[안부웍스] 긴급 도움 요청',
    body: '부모님께서 “도움이 필요해요” 신호를 보냈습니다.\n가능하시면 요청함에서 수락 후 전화 또는 방문 확인을 부탁드립니다.\n응급상황이 의심되면 119 또는 의료기관에 연락해주세요.',
    default_target_url: '/provider/requests',
    sort_order: 20,
    is_active: true
  },
  {
    code: 'provider-meal',
    category: '지역 도움망',
    title: '[안부웍스] 식사 확인 요청',
    body: '부모님께서 식사를 못 하셨다는 신호가 접수되었습니다.\n가능하시면 식사 여부를 확인하고, 필요 시 식사 전달 또는 지역상점 연결을 부탁드립니다.\n처리 결과는 요청함에서 완료로 남겨주세요.',
    default_target_url: '/provider/requests',
    sort_order: 30,
    is_active: true
  },
  {
    code: 'provider-medication',
    category: '지역 도움망',
    title: '[안부웍스] 복약 확인 요청',
    body: '부모님께서 약을 아직 못 드셨다는 신호가 접수되었습니다.\n먼저 실제 복약 여부를 확인해주세요.\n처방·복용량 판단은 보호자, 약사 또는 의료기관에 문의해야 합니다.',
    default_target_url: '/provider/requests',
    sort_order: 40,
    is_active: true
  },
  {
    code: 'provider-condition',
    category: '지역 도움망',
    title: '[안부웍스] 몸 상태 확인 요청',
    body: '부모님께서 몸이 불편하다는 신호를 보냈습니다.\n가능하시면 전화 또는 방문으로 상태를 확인해주세요.\n심한 통증, 어지러움, 호흡곤란, 낙상 의심 등은 119 또는 의료기관 연락이 필요합니다.',
    default_target_url: '/provider/requests',
    sort_order: 50,
    is_active: true
  },
  {
    code: 'guardian-followup',
    category: '보호자',
    title: '[안부웍스] 부모님 후속조치 확인',
    body: '부모님 안부 신호가 접수되었습니다.\n보호자 후속조치 화면에서 현재 상태와 다음 할 일을 확인해주세요.\n확인 후 처리 결과를 남겨주시면 가족 리포트에 반영됩니다.',
    default_target_url: '/response',
    sort_order: 60,
    is_active: true
  },
  {
    code: 'ops-escalation',
    category: '운영실',
    title: '[안부웍스] 운영실 확인 필요',
    body: '후속조치 요청이 일정 시간 동안 완료되지 않았습니다.\n운영실에서 보호자 또는 지역 도움망 연결 상태를 확인해주세요.\n필요하면 수동 연결 또는 재알림을 진행해주세요.',
    default_target_url: '/response?scope=ops',
    sort_order: 70,
    is_active: true
  },
  {
    code: 'provider-reminder',
    category: '지역 도움망',
    title: '[안부웍스] 처리상태 확인 요청',
    body: '수락하신 후속조치 요청이 아직 완료 처리되지 않았습니다.\n처리가 끝났다면 요청함에서 “처리 완료”를 눌러주세요.\n진행이 어렵다면 운영실이 다른 도움망을 찾을 수 있도록 알려주세요.',
    default_target_url: '/provider/requests',
    sort_order: 80,
    is_active: true
  },
  {
    code: 'report-arrived',
    category: '보호자',
    title: '[안부웍스] 부모님 리포트 도착',
    body: '부모님 케어 리포트가 도착했습니다.\n식사, 복약, 몸 상태, 도움 요청 기록을 확인해주세요.\n필요한 후속조치가 있으면 보호자 화면에서 처리할 수 있습니다.',
    default_target_url: '/child/dashboard',
    sort_order: 90,
    is_active: true
  },
  {
    code: 'family-action',
    category: '가족',
    title: '[안부웍스] 가족 확인 요청',
    body: '가족 확인이 필요한 안부 요청이 있습니다.\n가능한 가족이 먼저 확인을 맡고, 처리 결과를 남겨주세요.\n반복되는 위험 신호는 운영실 또는 지역 도움망 연결이 필요할 수 있습니다.',
    default_target_url: '/family/actions',
    sort_order: 100,
    is_active: true
  }
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


function hasDispatchSecret(request: NextRequest) {
  const secrets = [
    process.env.CRON_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || '',
    process.env.RESPONSE_ESCALATION_SECRET || ''
  ].filter(Boolean)

  if (secrets.length === 0) return false

  const queryToken = text(request.nextUrl.searchParams.get('token'))
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')

  return secrets.includes(queryToken) || secrets.includes(auth)
}

function canUseDispatch(request: NextRequest) {
  return isOpsAuthed(request) || hasDispatchSecret(request)
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

function normalizeTemplate(row: Row): MessageTemplate {
  return {
    code: text(row.code),
    category: text(row.category) || 'general',
    title: text(row.title),
    body: text(row.body),
    default_target_url: text(row.default_target_url) || '/ops/notification-dispatch',
    sort_order: Number(row.sort_order) || 100,
    is_active: row.is_active !== false
  }
}

async function loadTemplates() {
  const result = await rest('notification_message_templates?select=*&is_active=eq.true&order=sort_order.asc')

  const loaded = rows(result)
    .map(normalizeTemplate)
    .filter((item) => item.code && item.title && item.body)

  return loaded.length > 0 ? loaded : FALLBACK_TEMPLATES
}

async function findTemplate(code: string) {
  const templates = await loadTemplates()
  return templates.find((item) => item.code === code) || templates[0] || FALLBACK_TEMPLATES[0]
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

async function createTemplateOutbox(input: {
  toPhone: string
  toName: string
  templateCode: string
  body?: string
  title?: string
  targetUrl?: string
}) {
  const toPhone = phone(input.toPhone)

  if (!toPhone) {
    return {
      ok: false,
      status: 400,
      data: null,
      error: '수신번호가 필요합니다.'
    }
  }

  const template = await findTemplate(input.templateCode || 'ops-test')
  const sourceKey = 'ops-template-' + Date.now() + '-' + randomUUID()

  return rest('notification_outbox', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        channel: 'sms',
        to_name: text(input.toName) || '수신자',
        to_phone: toPhone,
        title: text(input.title) || template.title,
        body: text(input.body) || template.body,
        template_code: template.code,
        reason: 'ops-template-message',
        target_url: text(input.targetUrl) || template.default_target_url,
        status: 'queued',
        provider: 'notification-dispatch-center',
        source_key: sourceKey,
        payload: {
          source: 'ops-template',
          templateCode: template.code,
          category: template.category,
          createdFrom: '/ops/notification-dispatch'
        }
      }
    ])
  })
}

export async function GET(request: NextRequest) {
  if (!canUseDispatch(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const [outboxResult, templates] = await Promise.all([
    loadOutbox(),
    loadTemplates()
  ])

  if (!outboxResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '알림 발송함을 불러오지 못했습니다.',
        detail: outboxResult.error
      },
      { status: 500 }
    )
  }

  const items = Array.isArray(outboxResult.data) ? outboxResult.data as Row[] : []

  return NextResponse.json({
    ok: true,
    configured: solapiReady(),
    config: {
      hasApiKey: Boolean(solapiConfig().apiKey),
      hasApiSecret: Boolean(solapiConfig().apiSecret),
      hasSender: Boolean(solapiConfig().sender),
      senderMasked: maskSender(solapiConfig().sender)
    },
    templates,
    items,
    metrics: metrics(items)
  })
}

export async function POST(request: NextRequest) {
  if (!canUseDispatch(request)) {
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

  if (action === 'enqueueTemplate' || action === 'enqueueAndSendTemplate' || action === 'enqueueTest' || action === 'enqueueAndSendTest') {
    const templateCode =
      text(body.templateCode) ||
      (action === 'enqueueTest' || action === 'enqueueAndSendTest' ? 'ops-test' : 'ops-test')

    const created = await createTemplateOutbox({
      toPhone: text(body.toPhone),
      toName: text(body.toName),
      templateCode,
      title: text(body.title),
      body: text(body.body),
      targetUrl: text(body.targetUrl)
    })

    if (!created.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '문자를 대기열에 넣지 못했습니다.',
          detail: created.error
        },
        { status: created.status || 500 }
      )
    }

    const item = Array.isArray(created.data) ? created.data[0] as Row : created.data as Row

    if (action === 'enqueueAndSendTemplate' || action === 'enqueueAndSendTest') {
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
      message: '선택한 문자 초안을 대기열에 넣었습니다.',
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
