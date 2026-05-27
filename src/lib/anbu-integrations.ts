import { createHmac, randomBytes } from 'crypto'

export type AnbuNotificationChannel = 'app' | 'sms' | 'kakao' | 'email'

export type AnbuNotificationPayload = {
  channel: AnbuNotificationChannel
  toName?: string
  toPhone?: string
  toEmail?: string
  title: string
  body: string
  familyCode?: string
  url?: string
  templateCode?: string
  reason?: string
}

export type AnbuIntegrationStatus = {
  key: string
  label: string
  configured: boolean
  desc: string
}

export function getIntegrationStatuses(): AnbuIntegrationStatus[] {
  return [
    {
      key: 'solapiApiKey',
      label: 'SOLAPI API Key',
      configured: Boolean(process.env.SOLAPI_API_KEY),
      desc: 'SOLAPI 문자 발송 API Key'
    },
    {
      key: 'solapiApiSecret',
      label: 'SOLAPI API Secret',
      configured: Boolean(process.env.SOLAPI_API_SECRET),
      desc: 'SOLAPI HMAC 인증 서명 생성용 Secret'
    },
    {
      key: 'smsFrom',
      label: 'SMS 발신번호',
      configured: Boolean(process.env.ANBU_SMS_FROM),
      desc: 'SOLAPI에 등록 완료된 문자 발신번호'
    },
    {
      key: 'kakaoSenderKey',
      label: '카카오 알림톡 Sender Key',
      configured: Boolean(process.env.KAKAO_ALIMTALK_SENDER_KEY),
      desc: '알림톡 발신 프로필 키. 템플릿 심사 후 사용'
    },
    {
      key: 'notificationWebhook',
      label: '알림 발송 Webhook',
      configured: Boolean(process.env.ANBU_NOTIFICATION_WEBHOOK_URL),
      desc: 'SMS 외 다른 채널을 외부 발송 서버로 넘길 때 사용하는 Webhook'
    },
    {
      key: 'notificationWebhookToken',
      label: 'Webhook 보안 토큰',
      configured: Boolean(process.env.ANBU_NOTIFICATION_WEBHOOK_TOKEN),
      desc: '외부 발송 서버 호출 시 Authorization에 넣을 토큰'
    },
    {
      key: 'tossClient',
      label: '토스페이먼츠 Client Key',
      configured: Boolean(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY),
      desc: '결제창 호출에 필요한 공개 키'
    },
    {
      key: 'tossSecret',
      label: '토스페이먼츠 Secret Key',
      configured: Boolean(process.env.TOSS_SECRET_KEY),
      desc: '결제 승인 확인에 필요한 서버 키'
    },
    {
      key: 'cronSecret',
      label: 'Cron Secret',
      configured: Boolean(process.env.CRON_SECRET),
      desc: '정기 알림 생성 API 보호용 비밀값'
    }
  ]
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

export async function supabaseInsert(table: string, payload: Record<string, unknown>) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      mode: 'local-fallback',
      error: 'Supabase env is missing'
    }
  }

  const response = await fetch(base + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify([payload]),
    cache: 'no-store'
  })

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    mode: 'supabase',
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

export async function supabaseSelect(path: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      mode: 'local-fallback',
      data: null as unknown,
      error: 'Supabase env is missing'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    mode: 'supabase',
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

export async function supabasePatch(path: string, payload: Record<string, unknown>) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      mode: 'local-fallback',
      error: 'Supabase env is missing'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload),
    cache: 'no-store'
  })

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    mode: 'supabase',
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

function createSolapiAuthHeader(apiKey: string, apiSecret: string) {
  const dateTime = new Date().toISOString()
  const salt = randomBytes(16).toString('hex')
  const signature = createHmac('sha256', apiSecret)
    .update(dateTime + salt)
    .digest('hex')

  return `HMAC-SHA256 apiKey=${apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}`
}

function buildSmsText(payload: AnbuNotificationPayload) {
  const title = payload.title || '안부웍스 알림'
  const body = payload.body || '확인이 필요한 안부 알림입니다.'
  const url = payload.url ? `\n${payload.url}` : ''
  return `[안부웍스] ${title}\n${body}${url}`.slice(0, 1900)
}

export async function dispatchSolapiSms(payload: AnbuNotificationPayload) {
  const smsSendMode = process.env.ANBU_SMS_SEND_MODE || 'live'

  if (
    smsSendMode === 'outbox' ||
    smsSendMode === 'paused' ||
    process.env.ANBU_SMS_PAUSED === 'true'
  ) {
    return {
      ok: false,
      mode: 'outbox-only',
      error: 'SMS sending is paused by ANBU_SMS_SEND_MODE. Notification was kept in outbox only.'
    }
  }
  const apiKey = process.env.SOLAPI_API_KEY || ''
  const apiSecret = process.env.SOLAPI_API_SECRET || ''
  const from = normalizePhone(process.env.ANBU_SMS_FROM || '')
  const to = normalizePhone(payload.toPhone || '')

  if (!apiKey || !apiSecret || !from) {
    return {
      ok: false,
      mode: 'solapi-missing-env',
      error: 'SOLAPI_API_KEY, SOLAPI_API_SECRET, ANBU_SMS_FROM 환경변수가 필요합니다.'
    }
  }

  if (!to) {
    return {
      ok: false,
      mode: 'solapi-missing-to',
      error: '수신자 휴대폰 번호가 없습니다.'
    }
  }

  const response = await fetch('https://api.solapi.com/messages/v4/send-many/detail', {
    method: 'POST',
    headers: {
      Authorization: createSolapiAuthHeader(apiKey, apiSecret),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        {
          to,
          from,
          text: buildSmsText(payload),
          autoTypeDetect: true
        }
      ]
    })
  })

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    mode: 'solapi-sms',
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

export async function dispatchNotificationWebhook(payload: AnbuNotificationPayload) {
  const webhookUrl = process.env.ANBU_NOTIFICATION_WEBHOOK_URL || ''
  const webhookToken = process.env.ANBU_NOTIFICATION_WEBHOOK_TOKEN || ''

  if (!webhookUrl) {
    return {
      ok: false,
      mode: 'outbox-only',
      error: 'ANBU_NOTIFICATION_WEBHOOK_URL is not configured'
    }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(webhookToken ? { Authorization: 'Bearer ' + webhookToken } : {})
    },
    body: JSON.stringify({
      service: 'anbuworks',
      payload,
      sentAt: new Date().toISOString()
    })
  })

  const responseText = await response.text()

  return {
    ok: response.ok,
    mode: 'webhook',
    data: responseText,
    error: response.ok ? null : responseText
  }
}

export async function dispatchNotification(payload: AnbuNotificationPayload) {
  if (payload.channel === 'sms') {
    return dispatchSolapiSms(payload)
  }

  return dispatchNotificationWebhook(payload)
}

export function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/[^\d+]/g, '')
}

export function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}
