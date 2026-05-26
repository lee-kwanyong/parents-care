type NotificationChannel = 'app' | 'sms' | 'alimtalk'

type NotificationPayload = {
  familyCode?: string
  channel: NotificationChannel
  eventType: string
  recipient?: string
  title?: string
  message: string
  payload?: Record<string, unknown>
}

type SupabaseResult = {
  ok: boolean
  data: unknown
  error: unknown
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function hasSupabaseEnv() {
  return Boolean(supabaseBaseUrl() && serviceKey())
}

function toDigits(value?: string) {
  return String(value || '').replace(/[^\d]/g, '')
}

function firstRow(data: unknown) {
  return Array.isArray(data) ? data[0] : null
}

async function supabaseRest(path: string, init?: RequestInit): Promise<SupabaseResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null,
      error: 'NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.'
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

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

export function notificationEnvStatus() {
  return {
    supabase: hasSupabaseEnv(),
    smsEnabled: process.env.ANBU_SMS_ENABLED === 'true',
    aligo: {
      apiKey: Boolean(process.env.ALIGO_API_KEY),
      userId: Boolean(process.env.ALIGO_USER_ID),
      sender: Boolean(process.env.ALIGO_SENDER)
    },
    kakaoAlimtalk: {
      enabled: process.env.ANBU_ALIMTALK_ENABLED === 'true',
      provider: process.env.ANBU_ALIMTALK_PROVIDER || '',
      templateAttention: Boolean(process.env.ANBU_ALIMTALK_TEMPLATE_ATTENTION)
    }
  }
}

export async function getGuardianPhone(familyCode: string) {
  if (!familyCode) return ''

  const result = await supabaseRest(
    'anbu_family_links?select=guardian_phone&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&link_status=eq.active&limit=1'
  )

  if (!result.ok) return ''

  const row = firstRow(result.data) as { guardian_phone?: string } | null
  return toDigits(row?.guardian_phone)
}

async function recordNotificationEvent(
  payload: NotificationPayload,
  status: string,
  detail?: {
    provider?: string
    providerMessageId?: string
    errorMessage?: string
    sentAt?: string | null
  }
) {
  const insert = await supabaseRest('anbu_notification_events', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_code: payload.familyCode || null,
        channel: payload.channel,
        event_type: payload.eventType,
        recipient: payload.recipient || null,
        title: payload.title || null,
        message: payload.message,
        provider: detail?.provider || null,
        provider_message_id: detail?.providerMessageId || null,
        status,
        error_message: detail?.errorMessage || null,
        payload: payload.payload || {},
        sent_at: detail?.sentAt || null
      }
    ])
  })

  return insert
}

async function sendAligoSms(to: string, message: string) {
  const receiver = toDigits(to)
  const sender = toDigits(process.env.ALIGO_SENDER)

  if (process.env.ANBU_SMS_ENABLED !== 'true') {
    return {
      ok: false,
      status: 'queued',
      error: 'ANBU_SMS_ENABLED가 true가 아니어서 실제 문자를 보내지 않았습니다.'
    }
  }

  if (!process.env.ALIGO_API_KEY || !process.env.ALIGO_USER_ID || !sender) {
    return {
      ok: false,
      status: 'config_missing',
      error: 'ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_SENDER 환경변수가 필요합니다.'
    }
  }

  if (!receiver) {
    return {
      ok: false,
      status: 'recipient_missing',
      error: '수신자 전화번호가 없습니다.'
    }
  }

  const params = new URLSearchParams()
  params.set('key', process.env.ALIGO_API_KEY)
  params.set('user_id', process.env.ALIGO_USER_ID)
  params.set('sender', sender)
  params.set('receiver', receiver)
  params.set('msg', message)
  params.set('msg_type', message.length > 90 ? 'LMS' : 'SMS')

  const response = await fetch('https://apis.aligo.in/send/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: params.toString()
  })

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = JSON.parse(bodyText)
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return {
      ok: false,
      status: 'failed',
      error: parsed
    }
  }

  const data = parsed as { result_code?: string | number; msg_id?: string | number; message?: string }

  if (String(data.result_code) !== '1') {
    return {
      ok: false,
      status: 'failed',
      error: parsed
    }
  }

  return {
    ok: true,
    status: 'sent',
    providerMessageId: data.msg_id ? String(data.msg_id) : undefined,
    data: parsed
  }
}

export async function dispatchNotification(payload: NotificationPayload) {
  if (payload.channel === 'app') {
    await recordNotificationEvent(payload, 'queued', {
      provider: 'app'
    })

    return {
      ok: true,
      status: 'queued',
      channel: 'app',
      message: '앱 알림 이벤트로 저장했습니다.'
    }
  }

  if (payload.channel === 'alimtalk') {
    await recordNotificationEvent(payload, 'queued', {
      provider: 'kakao_alimtalk',
      errorMessage: '알림톡은 템플릿 승인 후 실제 발송 연결이 가능합니다.'
    })

    return {
      ok: false,
      status: 'template_required',
      channel: 'alimtalk',
      message: '카카오 알림톡 템플릿 승인 후 실제 발송됩니다.'
    }
  }

  const sms = await sendAligoSms(payload.recipient || '', payload.message)

  await recordNotificationEvent(payload, sms.status, {
    provider: 'aligo',
    providerMessageId: sms.providerMessageId,
    errorMessage: sms.ok ? undefined : JSON.stringify(sms.error),
    sentAt: sms.ok ? new Date().toISOString() : null
  })

  return {
    ok: sms.ok,
    status: sms.status,
    channel: 'sms',
    message: sms.ok ? 'SMS를 발송했습니다.' : 'SMS가 발송되지 않고 이벤트로 저장되었습니다.',
    detail: sms
  }
}

function buildCheckinAlertMessage(input: {
  parentName: string
  careLabel: string
  status: string
  memo?: string
}) {
  const reason = input.memo || input.careLabel

  if (input.status === 'done') {
    return `[안부웍스] ${input.parentName} 안부 확인 완료: ${reason}`
  }

  if (input.status === 'not_done') {
    return `[안부웍스] ${input.parentName} 안부 확인 필요: ${reason}. 앱에서 오늘 상태를 확인해주세요.`
  }

  return `[안부웍스] ${input.parentName} 도움 요청 또는 확인 필요 신호가 있습니다: ${reason}. 보호자 확인이 필요합니다.`
}

export async function notifyGuardianForCheckin(input: {
  familyCode: string
  elderName: string
  checkType: string
  careLabel: string
  status: string
  memo?: string
}) {
  const shouldNotify =
    input.status !== 'done' ||
    process.env.ANBU_NOTIFY_ALL_CHECKINS === 'true'

  if (!shouldNotify) {
    return {
      ok: true,
      status: 'skipped',
      message: '정상 확인은 문자 발송을 생략했습니다.'
    }
  }

  const guardianPhone = await getGuardianPhone(input.familyCode)
  const message = buildCheckinAlertMessage({
    parentName: input.elderName || '부모님',
    careLabel: input.careLabel,
    status: input.status,
    memo: input.memo
  })

  if (!guardianPhone) {
    await recordNotificationEvent(
      {
        familyCode: input.familyCode,
        channel: 'app',
        eventType: 'daily_care_attention',
        title: '보호자 연락처 없음',
        message,
        payload: input
      },
      'recipient_missing',
      {
        provider: 'app',
        errorMessage: 'family_code에 연결된 guardian_phone이 없습니다.'
      }
    )

    return {
      ok: false,
      status: 'recipient_missing',
      message: '보호자 전화번호가 없어 알림 이벤트만 저장했습니다.'
    }
  }

  const channel: NotificationChannel =
    process.env.ANBU_NOTIFICATION_CHANNEL === 'alimtalk'
      ? 'alimtalk'
      : 'sms'

  return dispatchNotification({
    familyCode: input.familyCode,
    channel,
    eventType: 'daily_care_attention',
    recipient: guardianPhone,
    title: '안부온 확인 필요',
    message,
    payload: input
  })
}

export async function checkNotificationTables() {
  const tables = [
    'anbu_notification_events',
    'anbu_notification_templates'
  ]

  const results = await Promise.all(
    tables.map(async (table) => {
      const result = await supabaseRest(table + '?select=id&limit=1')
      return {
        table,
        ok: result.ok,
        message: result.ok ? '정상' : String(result.error).slice(0, 300)
      }
    })
  )

  return results
}
