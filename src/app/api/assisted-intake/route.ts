import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 'on' || value === '1'
}

function firstText(body: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = text(body[key])
    if (value) return value
  }

  return fallback
}

async function readBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const body: Record<string, unknown> = {}

    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        body[key] = value
      } else {
        body[key] = {
          name: value.name,
          type: value.type,
          size: value.size
        }
      }
    }

    return body
  }

  return await request.json().catch(() => ({}))
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null as any,
      error: 'Supabase 환경변수가 없습니다. NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return {
      ok: false,
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    data: parsed,
    error: null
  }
}

export async function GET() {
  const result = await rest(
    'care_assisted_intake_requests?select=' +
      encodeURIComponent('id,elder_name,contact_name,contact_phone,channel,raw_text,summary_title,status,priority,social_care_requested,created_at') +
      '&order=created_at.desc&limit=50'
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '간편 접수 목록을 불러오지 못했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    items: Array.isArray(result.data) ? result.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await readBody(request)

  const elderName = firstText(body, [
    'elderName',
    'elder_name',
    'parentName',
    'parent_name',
    'parent',
    'elder',
    'name'
  ], '부모님')

  const contactName = firstText(body, [
    'guardianName',
    'guardian_name',
    'contactName',
    'contact_name',
    'protectorName',
    'familyName',
    'applicantName'
  ], '')

  const contactPhone = firstText(body, [
    'guardianPhone',
    'guardian_phone',
    'contactPhone',
    'contact_phone',
    'phone',
    'mobile'
  ], '')

  const rawText = firstText(body, [
    'situationMemo',
    'situation',
    'memo',
    'rawText',
    'raw_text',
    'message',
    'description',
    'note'
  ], '')

  const worryType = firstText(body, [
    'worryType',
    'worry_type',
    'selectedWorry',
    'selected_worry',
    'category',
    'careType',
    'requestType'
  ], '')

  const channel = firstText(body, [
    'channel',
    'preferredResponseChannel',
    'preferred_response_channel',
    'responseChannel',
    'contactMethod',
    'method'
  ], 'memo')

  const socialCareRequested = bool(
    body.socialCareRequested ??
    body.social_care_requested ??
    body.needSupport ??
    body.publicSupportRequested
  )

  if (!contactName || !contactPhone) {
    return NextResponse.json(
      {
        ok: false,
        message: '보호자 이름과 연락처를 입력해주세요.'
      },
      { status: 400 }
    )
  }

  const summaryTitle =
    worryType ||
    (rawText ? rawText.slice(0, 36) : `${elderName} 안심케어 접수`)

  const row = {
    elder_name: elderName,
    contact_name: contactName,
    contact_phone: contactPhone,
    channel,
    raw_text: rawText,
    summary_title: summaryTitle,
    worry_type: worryType || null,
    preferred_response_channel: channel,
    status: 'received',
    priority: socialCareRequested ? 'high' : 'normal',
    social_care_requested: socialCareRequested,
    assets: [],
    metadata: {
      source: 'care-request',
      submitted_at: new Date().toISOString()
    }
  }

  const insert = await rest('care_assisted_intake_requests', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation'
    },
    body: JSON.stringify([row])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '간편 접수 저장 중 오류가 발생했습니다.',
        detail: insert.error,
        hint: 'Supabase SQL Editor에서 care_assisted_intake_requests 테이블 생성 SQL과 notify pgrst reload schema를 실행했는지 확인하세요.'
      },
      { status: 500 }
    )
  }

  const item = Array.isArray(insert.data) ? insert.data[0] : insert.data

  return NextResponse.json({
    ok: true,
    message: '부모님 안심케어 접수가 저장됐습니다.',
    item
  })
}
