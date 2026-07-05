import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d+]/g, '').slice(0, 30)
}

function supabaseBaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function restBaseUrl() {
  const base = supabaseBaseUrl()
  return base ? `${base}/rest/v1` : ''
}

async function insertSupabase(row: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase 환경변수가 없습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/support_inquiries`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(row),
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    return {
      ok: response.ok,
      rows: response.ok && Array.isArray(parsed) ? (parsed as Row[]) : [],
      error: response.ok ? '' : `support_inquiries: ${response.status} ${raw.slice(0, 300)}`
    }
  } catch (error) {
    return {
      ok: false,
      rows: [] as Row[],
      error: error instanceof Error ? error.message : 'insert failed'
    }
  }
}

async function updateNotifyStatus(id: string, patch: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key || !id) return

  try {
    await fetch(`${base}/support_inquiries?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patch),
      cache: 'no-store'
    })
  } catch {
    // noop
  }
}

async function sendResendMail(input: {
  subject: string
  html: string
  replyTo?: string
}) {
  const apiKey = process.env.RESEND_API_KEY || ''
  const to = process.env.SUPPORT_ALERT_TO_EMAIL || 'mixer0326@gmail.com'
  const from = process.env.SUPPORT_FROM_EMAIL || 'AnbuWorks Support <onboarding@resend.dev>'

  if (!apiKey) {
    return {
      ok: false,
      skipped: true,
      email: to,
      error: 'RESEND_API_KEY 없음'
    }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        html: input.html,
        reply_to: input.replyTo || undefined
      }),
      cache: 'no-store'
    })

    const raw = await response.text()

    if (!response.ok) {
      return {
        ok: false,
        skipped: false,
        email: to,
        error: `${response.status} ${raw.slice(0, 400)}`
      }
    }

    return {
      ok: true,
      skipped: false,
      email: to,
      error: ''
    }
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      email: to,
      error: error instanceof Error ? error.message : 'send failed'
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as Row

  const name = text(body.name).slice(0, 50)
  const userPhone = phone(body.phone)
  const userEmail = text(body.email).slice(0, 100)
  const category = text(body.category).slice(0, 40) || 'general'
  const message = text(body.message).slice(0, 4000)
  const pagePath = text(body.pagePath).slice(0, 200)

  if (!name) {
    return NextResponse.json({ ok: false, message: '이름을 입력해 주세요.' }, { status: 400 })
  }

  if (message.length < 5) {
    return NextResponse.json({ ok: false, message: '문의 내용을 조금 더 자세히 입력해 주세요.' }, { status: 400 })
  }

  const notifyTo = process.env.SUPPORT_ALERT_TO_EMAIL || 'mixer0326@gmail.com'

  const row: Row = {
    name,
    phone: userPhone || null,
    email: userEmail || null,
    category,
    message,
    page_path: pagePath || null,
    status: 'received',
    notify_email: notifyTo,
    notify_status: 'pending',
    metadata: {
      source: 'support_center',
      userAgent: request.headers.get('user-agent') || '',
      referer: request.headers.get('referer') || ''
    }
  }

  const inserted = await insertSupabase(row)
  const insertedId = typeof inserted.rows[0]?.id === 'string' ? inserted.rows[0]?.id : ''

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.7;">
      <h2>[안부웍스 문의 접수]</h2>
      <p><strong>이름</strong>: ${name}</p>
      <p><strong>연락처</strong>: ${userPhone || '-'}</p>
      <p><strong>이메일</strong>: ${userEmail || '-'}</p>
      <p><strong>문의 유형</strong>: ${category}</p>
      <p><strong>유입 페이지</strong>: ${pagePath || '-'}</p>
      <p><strong>문의 내용</strong></p>
      <div style="white-space:pre-wrap;border:1px solid #d6ede7;border-radius:12px;padding:14px;">${message.replace(/</g, '&lt;')}</div>
      <p style="margin-top:16px;color:#637B76;">본 메일은 안부웍스 고객센터 자동 알림입니다.</p>
    </div>
  `

  const mailed = await sendResendMail({
    subject: `[안부웍스 문의] ${category} / ${name}`,
    html,
    replyTo: userEmail || undefined
  })

  if (insertedId) {
    await updateNotifyStatus(insertedId, {
      notify_status: mailed.ok ? 'sent' : mailed.skipped ? 'skipped' : 'failed',
      notify_error: mailed.ok ? null : mailed.error || null
    })
  }

  const success = inserted.ok || mailed.ok

  if (!success) {
    return NextResponse.json(
      {
        ok: false,
        message: '문의 저장 또는 알림 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        detail: {
          insertError: inserted.error,
          mailError: mailed.error
        }
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '문의가 접수되었습니다. 운영자가 확인 후 연락드릴게요.',
    stored: inserted.ok,
    notified: mailed.ok,
    notifyEmail: notifyTo
  })
}
