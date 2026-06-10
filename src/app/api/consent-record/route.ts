import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

const requiredItems = [
  'privacy',
  'nonMedical',
  'emergency',
  'reportAccess',
  'proxyRecord'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function bool(value: unknown) {
  return value === true || value === 'true'
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function rest(path: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: 'SUPABASE_SERVICE_ROLE_KEY가 필요합니다.'
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

function ipHash(request: NextRequest) {
  const raw =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    ''

  if (!raw) return ''

  return createHash('sha256').update(raw).digest('hex')
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const agreedItems = Array.isArray(body.agreedItems) ? body.agreedItems.map(text).filter(Boolean) : []

  const missing = requiredItems.filter((item) => !agreedItems.includes(item))

  if (missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: '필수 동의 항목을 모두 확인해주세요.',
        missing
      },
      { status: 400 }
    )
  }

  const role = text(body.role) || 'guardian'
  const familyCode = text(body.familyCode).replace(/[^0-9A-Za-z]/g, '').slice(0, 20)
  const name = text(body.name)
  const contactPhone = phone(body.phone)

  if (!name || !contactPhone) {
    return NextResponse.json(
      {
        ok: false,
        message: '이름과 연락처를 입력해주세요.'
      },
      { status: 400 }
    )
  }

  const result = await rest('pilot_consent_records', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        role,
        family_code: familyCode || null,
        name,
        phone: contactPhone,
        guardian_name: text(body.guardianName),
        guardian_phone: phone(body.guardianPhone),
        consent_status: 'agreed',
        consent_version: '2026-06-11-v1',
        agreed_items: agreedItems,
        source: text(body.source) || 'consent_page',
        path: text(body.path) || '/consent',
        ip_hash: ipHash(request),
        user_agent: request.headers.get('user-agent') || '',
        payload: {
          referrer: request.headers.get('referer') || '',
          submittedAt: new Date().toISOString(),
          role,
          familyCode,
          nonMedicalAcknowledged: bool(body.nonMedicalAcknowledged)
        }
      }
    ])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '동의 기록 저장에 실패했습니다.',
        detail: result.error
      },
      { status: result.status || 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '실증 참여 동의가 기록되었습니다.',
    record: rows(result)[0]
  })
}
