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

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || process.env.ADMIN_CODE || '530868'
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
      error: '개인정보 감사 기능은 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.'
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

function fieldsFromBody(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean)
  const raw = text(value)
  return raw ? raw.split(',').map((item) => item.trim()).filter(Boolean) : []
}

function consentLabel(status: string) {
  if (status === 'approved') return '동의 완료'
  if (status === 'revoked') return '동의 철회'
  if (status === 'rejected') return '동의 거부'
  if (status === 'expired') return '동의 만료'
  return '동의 대기'
}

function normalizeHousehold(row: Row, accessLogs: Row[], consentRecords: Row[]) {
  const familyCode = text(row.family_code)
  const id = text(row.id)

  const relatedLogs = accessLogs.filter((log) => {
    const targetId = text(log.target_id)
    const logFamilyCode = text(log.family_code)
    return targetId === id || (familyCode && logFamilyCode === familyCode)
  })

  const relatedConsents = consentRecords.filter((record) => {
    const targetId = text(record.target_id)
    const recordFamilyCode = text(record.family_code)
    return targetId === id || (familyCode && recordFamilyCode === familyCode)
  })

  return {
    ...row,
    consent_label: consentLabel(text(row.consent_status)),
    access_count: relatedLogs.length,
    last_access_at: relatedLogs[0]?.created_at || '',
    latest_consent_record: relatedConsents[0] || null,
    consent_record_count: relatedConsents.length
  }
}

function metrics(households: Row[], logs: Row[], consentRecords: Row[]) {
  const today = new Date().toISOString().slice(0, 10)

  return {
    households: households.length,
    consentApproved: households.filter((row) => text(row.consent_status) === 'approved').length,
    consentPending: households.filter((row) => text(row.consent_status) !== 'approved').length,
    accessLogs: logs.length,
    accessToday: logs.filter((row) => text(row.created_at).startsWith(today)).length,
    emergencyAccess: logs.filter((row) => text(row.purpose).includes('응급') || text(row.purpose).toLowerCase().includes('emergency')).length,
    providerAccess: logs.filter((row) => text(row.actor_type) === 'provider' || text(row.actor_type) === 'careWorker').length,
    consentRecords: consentRecords.length,
    revoked: consentRecords.filter((row) => text(row.consent_status) === 'revoked').length
  }
}

async function loadData() {
  const [householdResult, accessResult, consentResult] = await Promise.all([
    rest('care_households?select=*&order=created_at.desc&limit=1000'),
    rest('privacy_access_logs?select=*&order=created_at.desc&limit=1000'),
    rest('privacy_consent_records?select=*&order=created_at.desc&limit=1000')
  ])

  if (!householdResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '대상자 목록을 불러오지 못했습니다.',
      detail: householdResult.error
    }
  }

  if (!accessResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '개인정보 열람 로그를 불러오지 못했습니다.',
      detail: accessResult.error
    }
  }

  const accessLogs = rows(accessResult)
  const consentRecords = rows(consentResult)

  const households = rows(householdResult).map((row) => normalizeHousehold(row, accessLogs, consentRecords))

  return {
    ok: true,
    households,
    accessLogs,
    consentRecords,
    metrics: metrics(households, accessLogs, consentRecords),
    generatedAt: new Date().toISOString()
  }
}

async function loadHousehold(id: string) {
  const result = await rest('care_households?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
  return rows(result)[0]
}

async function recordAccess(request: NextRequest, body: Row) {
  const targetId = text(body.targetId || body.householdId)
  const household = targetId ? await loadHousehold(targetId) : null

  const familyCode = text(body.familyCode) || text(household?.family_code)
  const targetName = text(body.targetName) || text(household?.parent_name)

  const fieldsAccessed = fieldsFromBody(body.fieldsAccessed)

  if (!targetId && !familyCode) {
    return {
      ok: false,
      status: 400,
      message: '대상자 ID 또는 가족코드가 필요합니다.'
    }
  }

  if (fieldsAccessed.length === 0) {
    return {
      ok: false,
      status: 400,
      message: '열람 항목이 필요합니다.'
    }
  }

  const result = await rest('privacy_access_logs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        actor_type: text(body.actorType) || 'ops',
        actor_name: text(body.actorName) || '운영실',
        action_type: text(body.actionType) || 'view',
        target_type: text(body.targetType) || 'household',
        target_id: targetId || null,
        family_code: familyCode || null,
        target_name: targetName,
        purpose: text(body.purpose) || '후속조치 운영 확인',
        legal_basis: text(body.legalBasis) || 'service_operation',
        fields_accessed: fieldsAccessed,
        route_path: text(body.routePath) || '/admin/ops/privacy-audit',
        ip_hash: clientIpHash(request),
        user_agent: text(request.headers.get('user-agent')),
        result_status: 'recorded',
        payload: {
          household,
          original: body
        }
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '개인정보 열람 기록을 저장했습니다.' : '개인정보 열람 기록 저장에 실패했습니다.',
    accessLog: rows(result)[0],
    detail: result.error
  }
}

async function insertConsentRecord(input: {
  household: Row
  consentStatus: string
  evidenceNote: string
  collectedBy: string
  collectedVia: string
}) {
  const now = new Date().toISOString()

  return rest('privacy_consent_records', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_code: text(input.household.family_code),
        target_id: text(input.household.id) || null,
        subject_type: 'parent',
        subject_name: text(input.household.parent_name),
        subject_phone: phone(input.household.parent_phone),
        consent_type: 'care_service_privacy',
        consent_status: input.consentStatus,
        consent_version: '2026-06-v1',
        collected_by: input.collectedBy || '운영실',
        collected_via: input.collectedVia || 'ops',
        evidence_note: input.evidenceNote,
        consented_at: input.consentStatus === 'approved' ? now : null,
        revoked_at: input.consentStatus === 'revoked' ? now : null,
        payload: {
          guardian_name: text(input.household.guardian_name),
          guardian_phone: phone(input.household.guardian_phone)
        },
        updated_at: now
      }
    ])
  })
}

async function approveConsent(body: Row) {
  const id = text(body.householdId || body.targetId)

  if (!id) {
    return {
      ok: false,
      status: 400,
      message: '대상자 ID가 필요합니다.'
    }
  }

  const household = await loadHousehold(id)

  if (!household) {
    return {
      ok: false,
      status: 404,
      message: '대상자를 찾지 못했습니다.'
    }
  }

  const now = new Date().toISOString()

  const updateResult = await rest('care_households?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      consent_status: 'approved',
      consent_at: now,
      updated_at: now
    })
  })

  const consentResult = await insertConsentRecord({
    household,
    consentStatus: 'approved',
    evidenceNote: text(body.evidenceNote) || '운영실 동의 확인',
    collectedBy: text(body.actorName) || '운영실',
    collectedVia: text(body.collectedVia) || 'ops'
  })

  return {
    ok: updateResult.ok && consentResult.ok,
    status: updateResult.ok && consentResult.ok ? 200 : 500,
    message: updateResult.ok && consentResult.ok ? '개인정보 동의 완료로 변경했습니다.' : '동의 상태 변경에 실패했습니다.',
    household: rows(updateResult)[0],
    consentRecord: rows(consentResult)[0],
    detail: updateResult.error || consentResult.error
  }
}

async function revokeConsent(body: Row) {
  const id = text(body.householdId || body.targetId)

  if (!id) {
    return {
      ok: false,
      status: 400,
      message: '대상자 ID가 필요합니다.'
    }
  }

  const household = await loadHousehold(id)

  if (!household) {
    return {
      ok: false,
      status: 404,
      message: '대상자를 찾지 못했습니다.'
    }
  }

  const now = new Date().toISOString()

  const updateResult = await rest('care_households?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      consent_status: 'revoked',
      updated_at: now
    })
  })

  const consentResult = await insertConsentRecord({
    household,
    consentStatus: 'revoked',
    evidenceNote: text(body.evidenceNote) || '운영실 동의 철회 기록',
    collectedBy: text(body.actorName) || '운영실',
    collectedVia: text(body.collectedVia) || 'ops'
  })

  return {
    ok: updateResult.ok && consentResult.ok,
    status: updateResult.ok && consentResult.ok ? 200 : 500,
    message: updateResult.ok && consentResult.ok ? '개인정보 동의 철회로 변경했습니다.' : '동의 철회 처리에 실패했습니다.',
    household: rows(updateResult)[0],
    consentRecord: rows(consentResult)[0],
    detail: updateResult.error || consentResult.error
  }
}

async function seedPrivacyLogs(request: NextRequest, body: Row) {
  const data = await loadData()
  if (!data.ok) return data

  const households = data.households as Row[]
  const sample = households.slice(0, 5)

  const results = []

  for (const household of sample) {
    results.push(await recordAccess(request, {
      targetId: text(household.id),
      actorType: 'ops',
      actorName: text(body.actorName) || '운영실 테스트',
      purpose: '실증 점검용 개인정보 열람 기록',
      fieldsAccessed: ['parent_name', 'guardian_phone', 'service_area', 'risk_group'],
      routePath: '/admin/ops/privacy-audit'
    }))
  }

  return {
    ok: true,
    message: `테스트 열람 기록 ${results.length}건을 생성했습니다.`,
    results
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

  const data = await loadData()
  return NextResponse.json(data, { status: responseStatus(data) })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
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

  if (action === 'recordAccess') result = await recordAccess(request, body)
  else if (action === 'approveConsent') result = await approveConsent(body)
  else if (action === 'revokeConsent') result = await revokeConsent(body)
  else if (action === 'seedPrivacyLogs') result = await seedPrivacyLogs(request, body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
