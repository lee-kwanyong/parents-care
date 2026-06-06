import { createHash, timingSafeEqual } from 'crypto'
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

function bool(value: unknown) {
  return value === true || value === 'true' || value === 'on'
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

function hasSecret(request: NextRequest) {
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

function authorized(request: NextRequest) {
  return isOpsAuthed(request) || hasSecret(request)
}

function responseStatus(result: unknown) {
  const maybe = result as { ok?: boolean; status?: number }
  return maybe.ok ? 200 : maybe.status || 500
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
      error: '제안 문의 기능은 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.'
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

function hashValue(value: string) {
  if (!value) return ''
  return createHash('sha256').update(value + ':' + authSecret()).digest('hex')
}

function clientIpHash(request: NextRequest) {
  const forwarded = text(request.headers.get('x-forwarded-for')).split(',')[0]?.trim()
  const realIp = text(request.headers.get('x-real-ip'))
  return hashValue(forwarded || realIp || 'unknown')
}

function leadMetrics(leads: Row[]) {
  const today = new Date().toISOString().slice(0, 10)

  return {
    total: leads.length,
    new: leads.filter((row) => text(row.status) === 'new').length,
    contacted: leads.filter((row) => text(row.status) === 'contacted').length,
    qualified: leads.filter((row) => text(row.status) === 'qualified').length,
    closed: leads.filter((row) => text(row.status) === 'closed').length,
    today: leads.filter((row) => text(row.created_at).startsWith(today)).length,
    pilot: leads.filter((row) => text(row.interest_area) === 'pilot').length,
    procurement: leads.filter((row) => text(row.interest_area) === 'procurement').length
  }
}

async function createLead(request: NextRequest, body: Row) {
  if (text(body.website)) {
    return {
      ok: true,
      message: '문의가 접수되었습니다.'
    }
  }

  const organizationName = text(body.organizationName)
  const contactName = text(body.contactName)
  const contactPhone = phone(body.phone)
  const email = text(body.email)

  if (!organizationName) {
    return {
      ok: false,
      status: 400,
      message: '기관명을 입력해주세요.'
    }
  }

  if (!contactName) {
    return {
      ok: false,
      status: 400,
      message: '담당자명을 입력해주세요.'
    }
  }

  if (!contactPhone && !email) {
    return {
      ok: false,
      status: 400,
      message: '연락처 또는 이메일 중 하나는 필요합니다.'
    }
  }

  if (!bool(body.privacyAgreed)) {
    return {
      ok: false,
      status: 400,
      message: '문의 접수를 위한 개인정보 수집·이용 동의가 필요합니다.'
    }
  }

  const now = new Date().toISOString()

  const result = await rest('gov_proposal_leads', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        lead_type: 'gov_proposal',
        organization_name: organizationName,
        region: text(body.region),
        department_name: text(body.departmentName),
        contact_name: contactName,
        role_title: text(body.roleTitle),
        phone: contactPhone,
        email,
        households_count: Number(body.householdsCount) || null,
        interest_area: text(body.interestArea) || 'pilot',
        message: text(body.message),
        privacy_agreed: true,
        consent_at: now,
        status: 'new',
        ip_hash: clientIpHash(request),
        user_agent: text(request.headers.get('user-agent')),
        payload: {
          source: 'gov-proposal-landing',
          original: body
        },
        updated_at: now
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '문의가 접수되었습니다. 운영실에서 확인 후 연락드리겠습니다.' : '문의 접수에 실패했습니다.',
    lead: rows(result)[0],
    detail: result.error
  }
}

async function listLeads() {
  const result = await rest('gov_proposal_leads?select=*&order=created_at.desc&limit=500')

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '문의 목록을 불러오지 못했습니다.',
      detail: result.error
    }
  }

  const leads = rows(result)

  return {
    ok: true,
    leads,
    metrics: leadMetrics(leads)
  }
}

async function updateLead(body: Row) {
  const id = text(body.id)

  if (!id) {
    return {
      ok: false,
      status: 400,
      message: 'lead id가 필요합니다.'
    }
  }

  const patch: Row = {
    updated_at: new Date().toISOString()
  }

  if (text(body.status)) patch.status = text(body.status)
  if (text(body.followupNote)) patch.followup_note = text(body.followupNote)
  if (text(body.assignedTo)) patch.assigned_to = text(body.assignedTo)

  const result = await rest('gov_proposal_leads?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '문의 상태를 수정했습니다.' : '문의 상태 수정에 실패했습니다.',
    lead: rows(result)[0],
    detail: result.error
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const result = await listLeads()
  return NextResponse.json(result, { status: responseStatus(result) })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'createLead'

  if (action === 'createLead') {
    const result = await createLead(request, body)
    return NextResponse.json(result, { status: responseStatus(result) })
  }

  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  let result

  if (action === 'updateLead') result = await updateLead(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
