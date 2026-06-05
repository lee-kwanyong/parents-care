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
  return value === true || value === 'true'
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

function providerTypeLabel(type: string) {
  if (type === 'care_partner') return '돌봄파트너'
  if (type === 'caregiver') return '요양보호사'
  if (type === 'local_store') return '지역상점'
  if (type === 'meal_provider') return '도시락/반찬'
  if (type === 'pharmacy') return '약국'
  if (type === 'welfare_org') return '수행기관'
  if (type === 'gov_center') return '지자체'
  if (type === 'family') return '가족'
  return type || '제공자'
}

function enrichProvider(row: Row) {
  return {
    ...row,
    provider_type_label: providerTypeLabel(text(row.provider_type)),
    phone_masked: phone(row.phone)
      ? phone(row.phone).slice(0, 3) + '****' + phone(row.phone).slice(-4)
      : ''
  }
}

function metrics(providers: Row[]) {
  return {
    total: providers.length,
    available: providers.filter((row) => text(row.available_status) === 'available').length,
    paused: providers.filter((row) => text(row.available_status) !== 'available').length,
    verified: providers.filter((row) => text(row.verified_status) === 'verified').length,
    pending: providers.filter((row) => text(row.verified_status) !== 'verified').length,
    care: providers.filter((row) => ['care_partner', 'caregiver', 'welfare_org'].includes(text(row.provider_type))).length,
    food: providers.filter((row) => ['local_store', 'meal_provider'].includes(text(row.provider_type))).length,
    pharmacy: providers.filter((row) => text(row.provider_type) === 'pharmacy').length
  }
}

async function logProvider(input: {
  providerId?: string
  actionType: string
  message: string
  payload?: Row
}) {
  await rest('ops_network_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        provider_id: input.providerId || null,
        action_type: input.actionType,
        actor_name: '운영실',
        message: input.message,
        payload: input.payload || {}
      }
    ])
  })
}

async function createProvider(body: Row) {
  const providerName = text(body.providerName)
  const providerType = text(body.providerType) || 'care_partner'
  const providerPhone = phone(body.phone)

  if (!providerName) {
    return {
      ok: false,
      status: 400,
      message: '이름 또는 상호가 필요합니다.'
    }
  }

  const payload = {
    provider_type: providerType,
    provider_name: providerName,
    phone: providerPhone,
    email: text(body.email),
    service_area: text(body.serviceArea) || '우리동네',
    address_hint: text(body.addressHint),
    available_status: text(body.availableStatus) || 'available',
    verified_status: text(body.verifiedStatus) || 'verified',
    qualification: text(body.qualification),
    available_hours: text(body.availableHours) || '주간',
    response_time_min: Number(body.responseTimeMin) || 30,
    notes: text(body.notes),
    payload: {
      source: 'ops-network',
      original: body
    },
    updated_at: new Date().toISOString()
  }

  const result = await rest('care_providers', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  const provider = rows(result)[0]

  if (result.ok && provider) {
    await logProvider({
      providerId: text(provider.id),
      actionType: 'create_provider',
      message: `${providerName} 도움망을 등록했습니다.`,
      payload: provider
    })
  }

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '지역 도움망을 등록했습니다.' : '지역 도움망 등록에 실패했습니다.',
    provider,
    detail: result.error
  }
}

async function seedDemoProviders(body: Row) {
  const testPhone = phone(body.testPhone)
  const serviceArea = text(body.serviceArea) || '우리동네'

  if (!testPhone) {
    return {
      ok: false,
      status: 400,
      message: '테스트 수신번호가 필요합니다.'
    }
  }

  const suffix = new Date().toISOString().slice(11, 19).replace(/:/g, '')

  const demoRows = [
    {
      provider_type: 'care_partner',
      provider_name: `테스트 돌봄파트너 ${suffix}`,
      qualification: '생활확인 테스트',
      response_time_min: 5
    },
    {
      provider_type: 'caregiver',
      provider_name: `테스트 요양보호사 ${suffix}`,
      qualification: '방문확인 테스트',
      response_time_min: 10
    },
    {
      provider_type: 'meal_provider',
      provider_name: `테스트 식사도움 ${suffix}`,
      qualification: '식사 전달 테스트',
      response_time_min: 20
    },
    {
      provider_type: 'pharmacy',
      provider_name: `테스트 약국 ${suffix}`,
      qualification: '복약 상담 테스트',
      response_time_min: 30
    }
  ].map((row) => ({
    ...row,
    phone: testPhone,
    service_area: serviceArea,
    available_status: 'available',
    verified_status: 'verified',
    available_hours: '주간',
    notes: '실증 테스트용 자동 등록',
    payload: {
      source: 'ops-network-demo-seed',
      testPhone
    },
    updated_at: new Date().toISOString()
  }))

  const result = await rest('care_providers', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(demoRows)
  })

  const providers = rows(result)

  if (result.ok) {
    await logProvider({
      actionType: 'seed_demo_providers',
      message: `테스트 도움망 ${providers.length}명을 등록했습니다.`,
      payload: {
        providers,
        serviceArea
      }
    })
  }

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? `테스트 도움망 ${providers.length}명을 등록했습니다.` : '테스트 도움망 등록에 실패했습니다.',
    providers,
    detail: result.error
  }
}

async function updateProvider(body: Row) {
  const id = text(body.id)

  if (!id) {
    return {
      ok: false,
      status: 400,
      message: 'provider id가 필요합니다.'
    }
  }

  const patch: Row = {
    updated_at: new Date().toISOString()
  }

  if (text(body.availableStatus)) patch.available_status = text(body.availableStatus)
  if (text(body.verifiedStatus)) patch.verified_status = text(body.verifiedStatus)
  if (text(body.providerName)) patch.provider_name = text(body.providerName)
  if (text(body.providerType)) patch.provider_type = text(body.providerType)
  if (text(body.serviceArea)) patch.service_area = text(body.serviceArea)
  if (text(body.phone)) patch.phone = phone(body.phone)
  if (text(body.notes)) patch.notes = text(body.notes)
  if (text(body.qualification)) patch.qualification = text(body.qualification)
  if (Number(body.responseTimeMin)) patch.response_time_min = Number(body.responseTimeMin)

  const result = await rest('care_providers?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  const provider = rows(result)[0]

  if (result.ok) {
    await logProvider({
      providerId: id,
      actionType: 'update_provider',
      message: '지역 도움망 상태를 변경했습니다.',
      payload: {
        patch,
        provider
      }
    })
  }

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '지역 도움망 상태를 변경했습니다.' : '상태 변경에 실패했습니다.',
    provider,
    detail: result.error
  }
}

async function deleteProvider(body: Row) {
  const id = text(body.id)

  if (!id) {
    return {
      ok: false,
      status: 400,
      message: 'provider id가 필요합니다.'
    }
  }

  const result = await rest('care_providers?id=eq.' + encodeURIComponent(id), {
    method: 'DELETE'
  })

  if (result.ok) {
    await logProvider({
      providerId: id,
      actionType: 'delete_provider',
      message: '지역 도움망을 삭제했습니다.',
      payload: {
        id
      }
    })
  }

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '지역 도움망을 삭제했습니다.' : '삭제에 실패했습니다.',
    detail: result.error
  }
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

  const [providerResult, logResult] = await Promise.all([
    rest('care_providers?select=*&order=created_at.desc&limit=500'),
    rest('ops_network_logs?select=*&order=created_at.desc&limit=100')
  ])

  if (!providerResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '지역 도움망 목록을 불러오지 못했습니다.',
        detail: providerResult.error
      },
      { status: 500 }
    )
  }

  const providers = rows(providerResult).map(enrichProvider)

  return NextResponse.json({
    ok: true,
    providers,
    logs: rows(logResult),
    metrics: metrics(providers)
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

  let result

  if (action === 'createProvider') result = await createProvider(body)
  else if (action === 'seedDemoProviders') result = await seedDemoProviders(body)
  else if (action === 'updateProvider') result = await updateProvider(body)
  else if (action === 'deleteProvider') result = await deleteProvider(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: result.ok ? 200 : result.status || 500 })
}
