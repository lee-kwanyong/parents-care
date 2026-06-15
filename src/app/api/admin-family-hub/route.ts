import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

const ADMIN_SESSION_VALUE = 'anbu-admin-ok-v1'
const ADMIN_CODE = '530868'

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'ops_session_token',
  'OPS_SESSION_TOKEN',
  'ops_session'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function isObject(value: unknown): value is Row {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function payloadOf(row: Row | null | undefined) {
  if (!row) return {}
  return isObject(row.payload) ? row.payload : {}
}

function rawMeta(row: Row | null | undefined) {
  if (!row) return {}
  return isObject(row.raw_user_meta_data) ? row.raw_user_meta_data : {}
}

function getValue(row: Row | null | undefined, keys: string[]) {
  if (!row) return undefined

  const payload = payloadOf(row)
  const meta = rawMeta(row)

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key]
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') return payload[key]
    if (meta[key] !== undefined && meta[key] !== null && meta[key] !== '') return meta[key]
  }

  return undefined
}

function getText(row: Row | null | undefined, keys: string[], fallback = '') {
  return text(getValue(row, keys)) || fallback
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || process.env.OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function canonicalOpsCode() {
  return (
    text(process.env.ANBU_OPS_PASSWORD) ||
    text(process.env.OPS_PASSWORD) ||
    text(process.env.ADMIN_CODE) ||
    ADMIN_CODE
  )
}

function tokenFor(code: string) {
  return createHash('sha256').update(code + ':' + authSecret()).digest('hex')
}

function isAdminAuthed(request: NextRequest) {
  const adminCookie = request.cookies.get('anbu_admin_code_ok')?.value || ''
  const opsCookies = OPS_COOKIE_NAMES.map((name) => request.cookies.get(name)?.value || '').filter(Boolean)
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')
  const secrets = [
    process.env.CRON_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || '',
    process.env.RESPONSE_ESCALATION_SECRET || ''
  ].filter(Boolean)

  return (
    adminCookie === ADMIN_SESSION_VALUE ||
    adminCookie === tokenFor(ADMIN_CODE) ||
    opsCookies.includes(tokenFor(canonicalOpsCode())) ||
    secrets.includes(auth)
  )
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

function phoneDigits(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function maskPhone(value: unknown) {
  const digits = phoneDigits(value)

  if (digits.length >= 10) return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
  if (digits.length >= 4) return `****-${digits.slice(-4)}`

  return ''
}

function maskName(value: unknown) {
  const name = text(value)
  if (!name) return ''
  if (name.length === 1) return name
  if (name.length === 2) return `${name[0]}*`
  return `${name[0]}*${name[name.length - 1]}`
}

function kstDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(value)
}

function isTodayKst(value: unknown) {
  const raw = text(value)
  if (!raw) return false

  const parsed = Date.parse(raw)
  if (!Number.isFinite(parsed)) return false

  return kstDate(new Date(parsed)) === kstDate(new Date())
}

function latestByFamily<T extends { familyCode: string; createdAt: string }>(items: T[]) {
  const map = new Map<string, T>()

  for (const item of items) {
    if (!item.familyCode) continue
    if (!map.has(item.familyCode)) map.set(item.familyCode, item)
  }

  return map
}

async function restRows(table: string, params: Record<string, string>): Promise<{ ok: boolean; rows: Row[]; error?: string }> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  const search = new URLSearchParams(params)

  try {
    const response = await fetch(`${base}/${table}?${search.toString()}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    if (!response.ok) {
      return {
        ok: false,
        rows: [],
        error: `${table}: ${response.status} ${raw.slice(0, 220)}`
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : []
    }
  } catch (error) {
    return {
      ok: false,
      rows: [],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function fetchAuthUsers() {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      users: [] as Row[],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/auth/v1/admin/users?per_page=1000&page=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = {}

    try {
      parsed = raw ? JSON.parse(raw) : {}
    } catch {
      parsed = {}
    }

    if (!response.ok) {
      return {
        ok: false,
        users: [] as Row[],
        error: `auth.users: ${response.status} ${raw.slice(0, 220)}`
      }
    }

    const obj = isObject(parsed) ? parsed : {}
    const users = Array.isArray(obj.users)
      ? obj.users as Row[]
      : Array.isArray(parsed)
        ? parsed as Row[]
        : []

    return {
      ok: true,
      users
    }
  } catch (error) {
    return {
      ok: false,
      users: [] as Row[],
      error: `auth.users: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

function normalizeCare(row: Row) {
  return {
    id: text(row.id),
    familyCode: text(row.family_code),
    parentName: text(row.parent_name),
    guardianName: text(row.guardian_name),
    signalType: text(row.signal_type),
    signalLabel: text(row.signal_label) || text(row.signal_type) || '안부 기록',
    requestType: text(row.request_type),
    riskLevel: text(row.risk_level) || 'low',
    status: text(row.status) || 'recorded',
    createdAt: text(row.created_at)
  }
}

function normalizeRingReport(row: Row) {
  return {
    id: text(row.id),
    familyCode: text(row.family_code),
    parentName: text(row.parent_name),
    guardianName: text(row.guardian_name),
    status: getText(row, ['overall_status', 'status'], 'recorded'),
    score: num(getValue(row, ['anbu_score', 'score', 'overall_score', 'anbu_rhythm_score'])),
    quality: num(getValue(row, ['data_quality_score', 'quality_score'])),
    battery: num(getValue(row, ['battery_level', 'battery_pct', 'battery'])),
    wearMinutes: num(getValue(row, ['wear_minutes', 'wear_time_minutes', 'wear_time'])),
    createdAt: text(row.created_at || row.report_date)
  }
}

function normalizeDevice(row: Row) {
  return {
    id: text(row.id),
    familyCode: text(row.family_code),
    supplier: text(row.supplier) || '미등록',
    model: text(row.model) || '미등록',
    stage: text(row.stage) || '미등록',
    status: text(row.status) || 'active',
    serialNumber: text(row.serial_number),
    ringSize: text(row.ring_size),
    batteryPct: num(row.battery_pct),
    dataQualityScore: num(row.data_quality_score),
    wearMinutesAvg: num(row.wear_minutes_avg),
    memo: text(row.memo),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at)
  }
}

function riskOf(input: {
  latestCare?: ReturnType<typeof normalizeCare> | null
  latestRing?: ReturnType<typeof normalizeRingReport> | null
}) {
  const care = input.latestCare
  const ring = input.latestRing

  if (
    care?.riskLevel === 'high' ||
    care?.status === 'manual_needed' ||
    care?.signalType === 'urgent_neighbor_help' ||
    care?.signalType === 'no_response' ||
    ring?.status === 'check_needed'
  ) {
    return {
      code: 'check-needed',
      label: '확인필요',
      tone: 'danger'
    }
  }

  if (
    care?.riskLevel === 'medium' ||
    care?.status === 'watch' ||
    ring?.status === 'watch' ||
    (ring?.quality || 0) > 0 && (ring?.quality || 0) < 45 ||
    (ring?.battery || 0) > 0 && (ring?.battery || 0) < 20
  ) {
    return {
      code: 'watch',
      label: '주의',
      tone: 'watch'
    }
  }

  if (care || ring) {
    return {
      code: 'completed',
      label: '완료',
      tone: 'safe'
    }
  }

  return {
    code: 'pending',
    label: '대기',
    tone: 'neutral'
  }
}

function normalizeAuthUser(row: Row) {
  const meta = rawMeta(row)

  const phone = getText(row, [
    'phone',
    'phoneNumber',
    'mobile',
    'guardianPhone',
    'parentPhone'
  ])

  const familyCode = text(
    meta.familyCode ||
    meta.family_code ||
    meta.family_code_input ||
    row.family_code
  )

  return {
    id: text(row.id),
    familyCode,
    email: text(row.email),
    phone,
    phoneDigits: phoneDigits(phone),
    name: getText(row, ['name', 'full_name', 'guardianName', 'parentName'], text(row.email) || '가입자'),
    address: getText(row, ['address', 'parentAddress', 'guardianAddress']),
    role: getText(row, ['role', 'userRole'], 'user'),
    createdAt: text(row.created_at),
    lastSignInAt: text(row.last_sign_in_at)
  }
}

function normalizeFamily(row: Row) {
  const parentPhone = getText(row, ['parent_phone', 'parentPhone'])
  const guardianPhone = getText(row, ['guardian_phone', 'guardianPhone'])

  return {
    id: text(row.id),
    source: 'family',
    familyCode: text(row.family_code),
    parentName: getText(row, ['parent_name', 'parentName'], '부모님'),
    guardianName: getText(row, ['guardian_name', 'guardianName'], '보호자'),
    parentPhone,
    parentPhoneMasked: maskPhone(parentPhone),
    guardianPhone,
    guardianPhoneMasked: maskPhone(guardianPhone),
    parentAddress: getText(row, ['parent_address', 'parentAddress', 'address']),
    guardianAddress: getText(row, ['guardian_address', 'guardianAddress', 'address']),
    memberStatus: getText(row, ['member_status', 'status'], 'active'),
    adminMemo: getText(row, ['admin_memo', 'memo']),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at)
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Admin 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const [
    familyResult,
    careResult,
    ringResult,
    deviceResult,
    duplicateResult,
    authResult
  ] = await Promise.all([
    restRows('anbu_family_links', {
      select: '*',
      order: 'created_at.desc',
      limit: '1000'
    }),
    restRows('care_response_requests', {
      select: '*',
      order: 'created_at.desc',
      limit: '1000'
    }),
    restRows('ring_daily_reports', {
      select: '*',
      order: 'created_at.desc',
      limit: '1000'
    }),
    restRows('ops_ring_pilot_devices', {
      select: '*',
      order: 'updated_at.desc',
      limit: '1000'
    }),
    restRows('ops_phone_duplicate_reviews', {
      select: '*',
      reviewed: 'eq.false',
      order: 'created_at.desc',
      limit: '1000'
    }),
    fetchAuthUsers()
  ])

  const sourceErrors = [
    !familyResult.ok ? familyResult.error : '',
    !careResult.ok ? careResult.error : '',
    !ringResult.ok ? ringResult.error : '',
    !deviceResult.ok ? deviceResult.error : '',
    !duplicateResult.ok ? duplicateResult.error : '',
    !authResult.ok ? authResult.error : ''
  ].filter(Boolean)

  const familiesBase = familyResult.ok ? familyResult.rows.map(normalizeFamily) : []
  const authUsers = authResult.users.map(normalizeAuthUser)
  const careRecords = careResult.ok ? careResult.rows.map(normalizeCare) : []
  const ringReports = ringResult.ok ? ringResult.rows.map(normalizeRingReport) : []
  const ringDevices = deviceResult.ok ? deviceResult.rows.map(normalizeDevice) : []

  const latestCareMap = latestByFamily(careRecords)
  const latestRingMap = latestByFamily(ringReports)

  const deviceMap = new Map<string, ReturnType<typeof normalizeDevice>[]>()
  for (const device of ringDevices) {
    if (!device.familyCode) continue
    const items = deviceMap.get(device.familyCode) || []
    items.push(device)
    deviceMap.set(device.familyCode, items)
  }

  const duplicateMap = new Map<string, Row[]>()
  for (const row of duplicateResult.rows) {
    const code = text(row.family_code)
    if (!code) continue
    const items = duplicateMap.get(code) || []
    items.push(row)
    duplicateMap.set(code, items)
  }

  const phoneToFamily = new Map<string, string>()
  for (const family of familiesBase) {
    if (phoneDigits(family.parentPhone)) phoneToFamily.set(phoneDigits(family.parentPhone), family.familyCode)
    if (phoneDigits(family.guardianPhone)) phoneToFamily.set(phoneDigits(family.guardianPhone), family.familyCode)
  }

  const familyMap = new Map<string, ReturnType<typeof normalizeFamily> & {
    authUsers: ReturnType<typeof normalizeAuthUser>[]
  }>()

  for (const family of familiesBase) {
    familyMap.set(family.familyCode || family.id, {
      ...family,
      authUsers: []
    })
  }

  for (const user of authUsers) {
    const code = user.familyCode || phoneToFamily.get(user.phoneDigits) || ''

    if (code && familyMap.has(code)) {
      familyMap.get(code)?.authUsers.push(user)
      continue
    }

    const key = `auth:${user.id}`

    familyMap.set(key, {
      id: key,
      source: 'auth',
      familyCode: code,
      parentName: user.role === 'parent' ? user.name : '부모님 미연결',
      guardianName: user.role !== 'parent' ? user.name : '보호자 미연결',
      parentPhone: user.role === 'parent' ? user.phone : '',
      parentPhoneMasked: user.role === 'parent' ? maskPhone(user.phone) : '',
      guardianPhone: user.role !== 'parent' ? user.phone : '',
      guardianPhoneMasked: user.role !== 'parent' ? maskPhone(user.phone) : '',
      parentAddress: user.role === 'parent' ? user.address : '',
      guardianAddress: user.role !== 'parent' ? user.address : '',
      memberStatus: 'auth-only',
      adminMemo: '',
      createdAt: user.createdAt,
      updatedAt: user.lastSignInAt,
      authUsers: [user]
    })
  }

  const rows = Array.from(familyMap.values()).map((family) => {
    const latestCare = latestCareMap.get(family.familyCode) || null
    const latestRing = latestRingMap.get(family.familyCode) || null
    const devices = deviceMap.get(family.familyCode) || []
    const duplicates = duplicateMap.get(family.familyCode) || []
    const risk = riskOf({ latestCare, latestRing })
    const todayCare = careRecords.filter((item) => item.familyCode === family.familyCode && isTodayKst(item.createdAt))
    const todayRing = ringReports.filter((item) => item.familyCode === family.familyCode && isTodayKst(item.createdAt))

    return {
      ...family,
      parentNameMasked: maskName(family.parentName),
      guardianNameMasked: maskName(family.guardianName),
      authUsers: family.authUsers,
      latestCare,
      latestRing,
      ringDevices: devices,
      hasSmartRing: devices.length > 0 || Boolean(latestRing),
      duplicateCount: duplicates.length,
      duplicateDecisions: Array.from(new Set(duplicates.map((item) => text(item.decision)).filter(Boolean))),
      risk,
      todayCareCount: todayCare.length,
      todayRingCount: todayRing.length,
      lastActivityAt: latestCare?.createdAt || latestRing?.createdAt || family.updatedAt || family.createdAt
    }
  }).sort((a, b) => {
    const rank = { 'check-needed': 0, watch: 1, pending: 2, completed: 3 }
    return (rank[a.risk.code as keyof typeof rank] ?? 9) - (rank[b.risk.code as keyof typeof rank] ?? 9)
      || Date.parse(b.lastActivityAt || '') - Date.parse(a.lastActivityAt || '')
  })

  const realFamilies = rows.filter((row) => row.source === 'family')
  const todayCompleted = rows.filter((row) => row.risk.code === 'completed' && (row.todayCareCount > 0 || row.todayRingCount > 0)).length
  const denominator = Math.max(1, realFamilies.length || rows.length)

  const metrics = {
    totalFamilies: realFamilies.length,
    totalRows: rows.length,
    authUsers: authUsers.length,
    smartRingFamilies: rows.filter((row) => row.hasSmartRing).length,
    checkNeeded: rows.filter((row) => row.risk.code === 'check-needed').length,
    watch: rows.filter((row) => row.risk.code === 'watch').length,
    pending: rows.filter((row) => row.risk.code === 'pending').length,
    completed: rows.filter((row) => row.risk.code === 'completed').length,
    todayCompleted,
    completionRate: Math.round((todayCompleted / denominator) * 100),
    duplicateFamilies: rows.filter((row) => row.duplicateCount > 0).length,
    todayCareRecords: careRecords.filter((item) => isTodayKst(item.createdAt)).length,
    todayRingReports: ringReports.filter((item) => isTodayKst(item.createdAt)).length
  }

  return NextResponse.json({
    ok: true,
    generatedKst: new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date()),
    metrics,
    rows,
    issueLists: {
      checkNeeded: rows.filter((row) => row.risk.code === 'check-needed').slice(0, 30),
      watch: rows.filter((row) => row.risk.code === 'watch').slice(0, 30),
      duplicates: rows.filter((row) => row.duplicateCount > 0).slice(0, 30),
      smartRing: rows.filter((row) => row.hasSmartRing).slice(0, 30)
    },
    sourceErrors
  })
}
