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
      key: 'notificationWebhook',
      label: '알림 발송 Webhook',
      configured: Boolean(process.env.ANBU_NOTIFICATION_WEBHOOK_URL),
      desc: 'SMS, 카카오 알림톡, 이메일 발송 서버로 전달할 공통 Webhook'
    },
    {
      key: 'notificationWebhookToken',
      label: 'Webhook 보안 토큰',
      configured: Boolean(process.env.ANBU_NOTIFICATION_WEBHOOK_TOKEN),
      desc: '외부 발송 서버 호출 시 Authorization에 넣을 토큰'
    },
    {
      key: 'smsFrom',
      label: 'SMS 발신번호',
      configured: Boolean(process.env.ANBU_SMS_FROM),
      desc: '문자 발송에 사용할 대표 발신번호'
    },
    {
      key: 'kakaoSenderKey',
      label: '카카오 알림톡 Sender Key',
      configured: Boolean(process.env.KAKAO_ALIMTALK_SENDER_KEY),
      desc: '카카오 알림톡 발신 프로필 키'
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
