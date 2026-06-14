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

const STAGES = ['샘플대기', '수령완료', '가구배정', '데이터수집', '리포트검증', '문제확인', '완료']

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
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

function normalizeStage(value: unknown) {
  const stage = text(value)
  return STAGES.includes(stage) ? stage : '샘플대기'
}

function modelCatalog() {
  return [
    {
      model: 'TM22',
      supplier: 'eIoT',
      samplePriceUsd: 22,
      unit500Usd: 20,
      unit1000Usd: 19.5,
      material: '항균 스테인리스',
      weight: '5.5g',
      battery: '4~6일',
      waterproof: '5ATM',
      memory: '링 내부 1주일 저장',
      sensors: ['PPG', '체온 센서', 'G-sensor', 'BLE5.4'],
      features: ['심박', 'HRV', 'SpO2', '체온', '수면', '활동', '착용', '배터리']
    },
    {
      model: 'TM21',
      supplier: 'eIoT',
      samplePriceUsd: 24.5,
      unit500Usd: 22,
      unit1000Usd: 21.5,
      material: '항균 스테인리스',
      weight: '5.2g',
      battery: '4~6일',
      waterproof: '5ATM',
      memory: '링 내부 1주일 저장',
      sensors: ['PPG', '체온 센서', 'G-sensor', 'BLE5.4'],
      features: ['심박', 'HRV', 'SpO2', '체온', '수면', '활동', '착용', '배터리', 'SOS']
    },
    {
      model: 'AC11',
      supplier: 'eIoT',
      samplePriceUsd: 26,
      unit500Usd: 24.5,
      unit1000Usd: 23,
      material: '항균 스테인리스 + 나노 세라믹',
      weight: '5.2g',
      battery: '4~6일',
      waterproof: '5ATM',
      memory: '링 내부 1주일 저장',
      sensors: ['PPG', '체온 센서', 'G-sensor', 'BLE5.4'],
      features: ['심박', 'HRV', 'SpO2', '체온', '수면', '활동', '착용', '배터리', 'SOS']
    },
    {
      model: 'CE06',
      supplier: 'eIoT',
      samplePriceUsd: 24.5,
      unit500Usd: 22,
      unit1000Usd: 21.5,
      material: '항균 스테인리스',
      weight: '4.9g',
      battery: '4~6일',
      waterproof: '5ATM',
      memory: '링 내부 1주일 저장',
      sensors: ['PPG', '체온 센서', 'G-sensor', 'BLE5.4'],
      features: ['심박', 'HRV', 'SpO2', '체온', '수면', '활동', '착용', '배터리']
    },
    {
      model: 'BCL603M1',
      supplier: 'Goodway',
      samplePriceUsd: 0,
      unit500Usd: 0,
      unit1000Usd: 0,
      material: '확인 필요',
      weight: '확인 필요',
      battery: '5~9일 후보',
      waterproof: '5ATM 후보',
      memory: '확인 필요',
      sensors: ['PPG', '체온 센서', 'G-sensor'],
      features: ['심박', 'HRV', 'SpO2', '체온', '수면', '활동', '착용', '배터리']
    }
  ]
}

function accessoryCatalog() {
  return [
    { item: 'Magnetic Charging Cable P03', priceUsd: 0.5, memo: '기본 충전 케이블' },
    { item: 'Charging Case P08', priceUsd: 3.0, memo: '약 100일 대기' },
    { item: 'Charging Case P01', priceUsd: 4.4, memo: '약 200일 대기' },
    { item: 'Neutral Giftbox + Manual', priceUsd: 0.5, memo: '중립 박스, OEM MOQ 1000pcs' },
    { item: 'Sizing Kit', priceUsd: 2.5, memo: '샘플 기준, 6#~13#' },
    { item: 'Emotion Management', priceUsd: 1.0, memo: '스트레스·피로·기분 리포트 옵션' }
  ]
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

async function insertAdaptive(table: string, attempts: Row[]) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  let lastError = ''

  for (const body of attempts) {
    try {
      const response = await fetch(`${base}/${table}`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      })

      const raw = await response.text()
      let parsed: unknown = []

      try {
        parsed = raw ? JSON.parse(raw) : []
      } catch {
        parsed = []
      }

      if (response.ok) {
        return {
          ok: true,
          rows: Array.isArray(parsed) ? parsed as Row[] : []
        }
      }

      lastError = raw.slice(0, 240)
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'insert failed'
    }
  }

  return {
    ok: false,
    rows: [] as Row[],
    error: lastError || 'insert failed'
  }
}

async function patchDevice(id: string, body: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key || !id) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/ops_ring_pilot_devices?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        ...body,
        updated_at: new Date().toISOString()
      }),
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
        error: raw.slice(0, 240)
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
      error: error instanceof Error ? error.message : 'patch failed'
    }
  }
}

function getValue(row: Row | null | undefined, keys: string[]) {
  if (!row) return undefined

  const payload = row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
    ? row.payload as Row
    : {}

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key]
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') return payload[key]
  }

  return undefined
}

function normalizeDevice(row: Row) {
  return {
    id: text(row.id),
    familyCode: text(row.family_code),
    parentName: text(row.parent_name) || '부모님',
    guardianName: text(row.guardian_name) || '보호자',
    supplier: text(row.supplier) || 'eIoT',
    model: text(row.model) || 'TM22',
    color: text(row.color),
    ringSize: text(row.ring_size),
    serialNumber: text(row.serial_number),
    sampleType: text(row.sample_type) || 'sample',
    stage: normalizeStage(row.stage),
    status: text(row.status) || 'active',
    unitCostUsd: num(row.unit_cost_usd),
    accessoryCostUsd: num(row.accessory_cost_usd),
    sampleCount: num(row.sample_count, 1),
    batteryPct: num(row.battery_pct),
    wearMinutesAvg: num(row.wear_minutes_avg),
    dataQualityScore: num(row.data_quality_score),
    reportCount: num(row.report_count),
    guardianViewCount: num(row.guardian_view_count),
    lastSyncAt: text(row.last_sync_at),
    issue: text(row.issue),
    memo: text(row.memo),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at)
  }
}

function normalizeReport(row: Row) {
  return {
    id: text(row.id),
    familyCode: text(row.family_code),
    parentName: text(row.parent_name) || '부모님',
    guardianName: text(row.guardian_name) || '보호자',
    status: text(getValue(row, ['overall_status', 'status'])) || 'recorded',
    score: num(getValue(row, ['anbu_score', 'score', 'overall_score', 'anbu_rhythm_score'])),
    quality: num(getValue(row, ['data_quality_score', 'quality_score'])),
    battery: num(getValue(row, ['battery_level', 'battery_pct', 'battery'])),
    wearMinutes: num(getValue(row, ['wear_minutes', 'wear_time_minutes', 'wear_time'])),
    createdAt: text(row.created_at || row.report_date)
  }
}

function isTodayKst(value: string) {
  if (!value) return false

  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return false

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  return formatter.format(new Date(parsed)) === formatter.format(new Date())
}

function metrics(devices: ReturnType<typeof normalizeDevice>[], reports: ReturnType<typeof normalizeReport>[]) {
  const todayReports = reports.filter((report) => isTodayKst(report.createdAt))
  const checkNeeded = reports.filter((report) => report.status === 'check_needed')
  const lowQuality = reports.filter((report) => report.quality > 0 && report.quality < 45)
  const lowBattery = reports.filter((report) => report.battery > 0 && report.battery < 20)
  const lowWear = reports.filter((report) => report.wearMinutes > 0 && report.wearMinutes < 360)

  return {
    totalDevices: devices.length,
    activeDevices: devices.filter((device) => device.status === 'active').length,
    assignedDevices: devices.filter((device) => Boolean(device.familyCode)).length,
    todayReports: todayReports.length,
    checkNeeded: checkNeeded.length,
    lowQuality: lowQuality.length,
    lowBattery: lowBattery.length,
    lowWear: lowWear.length,
    sampleCount: devices.reduce((sum, device) => sum + device.sampleCount, 0),
    hardwareCostUsd: devices.reduce((sum, device) => sum + ((device.unitCostUsd + device.accessoryCostUsd) * Math.max(1, device.sampleCount)), 0),
    guardianViews: devices.reduce((sum, device) => sum + device.guardianViewCount, 0)
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

  const [deviceResult, reportResult, familyResult] = await Promise.all([
    restRows('ops_ring_pilot_devices', {
      select: '*',
      order: 'updated_at.desc',
      limit: '300'
    }),
    restRows('ring_daily_reports', {
      select: '*',
      order: 'created_at.desc',
      limit: '300'
    }),
    restRows('anbu_family_links', {
      select: 'family_code,parent_name,guardian_name,created_at',
      order: 'created_at.desc',
      limit: '200'
    })
  ])

  const devices = deviceResult.ok ? deviceResult.rows.map(normalizeDevice) : []
  const reports = reportResult.ok ? reportResult.rows.map(normalizeReport) : []
  const families = familyResult.ok
    ? familyResult.rows.map((row) => ({
        familyCode: text(row.family_code),
        parentName: text(row.parent_name) || '부모님',
        guardianName: text(row.guardian_name) || '보호자'
      })).filter((item) => item.familyCode)
    : []

  const latestReportByFamily = new Map<string, ReturnType<typeof normalizeReport>>()

  for (const report of reports) {
    if (report.familyCode && !latestReportByFamily.has(report.familyCode)) {
      latestReportByFamily.set(report.familyCode, report)
    }
  }

  const enrichedDevices = devices.map((device) => ({
    ...device,
    latestReport: latestReportByFamily.get(device.familyCode) || null
  }))

  const sourceErrors = [
    !deviceResult.ok ? deviceResult.error : '',
    !reportResult.ok ? reportResult.error : '',
    !familyResult.ok ? familyResult.error : ''
  ].filter(Boolean)

  return NextResponse.json({
    ok: true,
    stages: STAGES,
    devices: enrichedDevices,
    reports: reports.slice(0, 30),
    families,
    metrics: metrics(devices, reports),
    modelCatalog: modelCatalog(),
    accessoryCatalog: accessoryCatalog(),
    sourceErrors
  })
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Admin 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create') {
    const model = text(body.model) || 'TM22'
    const catalog = modelCatalog().find((item) => item.model === model)
    const sampleCount = num(body.sampleCount, 1)
    const unitCostUsd = num(body.unitCostUsd, catalog?.samplePriceUsd || 0)
    const accessoryCostUsd = num(body.accessoryCostUsd)

    const row = {
      family_code: text(body.familyCode),
      parent_name: text(body.parentName) || '부모님',
      guardian_name: text(body.guardianName) || '보호자',
      supplier: text(body.supplier) || catalog?.supplier || 'eIoT',
      model,
      color: text(body.color),
      ring_size: text(body.ringSize),
      serial_number: text(body.serialNumber),
      sample_type: text(body.sampleType) || 'sample',
      stage: normalizeStage(body.stage),
      status: text(body.status) || 'active',
      unit_cost_usd: unitCostUsd,
      accessory_cost_usd: accessoryCostUsd,
      sample_count: sampleCount,
      battery_pct: num(body.batteryPct),
      wear_minutes_avg: num(body.wearMinutesAvg),
      data_quality_score: num(body.dataQualityScore),
      issue: text(body.issue),
      memo: text(body.memo),
      payload: {
        createdFrom: 'ring-pilot-dashboard',
        quoteModel: catalog || null
      }
    }

    const result = await insertAdaptive('ops_ring_pilot_devices', [
      row,
      {
        ...row,
        payload: undefined
      },
      {
        family_code: row.family_code,
        parent_name: row.parent_name,
        guardian_name: row.guardian_name,
        supplier: row.supplier,
        model: row.model,
        stage: row.stage,
        status: row.status,
        sample_count: row.sample_count,
        memo: row.memo
      },
      {
        model: row.model,
        stage: row.stage,
        status: row.status
      }
    ])

    const record = result.rows[0] || {
      id: `local-${Date.now()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      ok: true,
      persisted: result.ok,
      warning: result.ok ? null : result.error || '서버 저장에 실패했지만 화면에는 임시로 표시됩니다.',
      device: normalizeDevice(record)
    })
  }

  if (action === 'update') {
    const id = text(body.id)

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: '기기 ID가 필요합니다.'
        },
        { status: 400 }
      )
    }

    const patch: Row = {}

    if (body.stage !== undefined) patch.stage = normalizeStage(body.stage)
    if (body.status !== undefined) patch.status = text(body.status)
    if (body.issue !== undefined) patch.issue = text(body.issue)
    if (body.memo !== undefined) patch.memo = text(body.memo)
    if (body.batteryPct !== undefined) patch.battery_pct = num(body.batteryPct)
    if (body.wearMinutesAvg !== undefined) patch.wear_minutes_avg = num(body.wearMinutesAvg)
    if (body.dataQualityScore !== undefined) patch.data_quality_score = num(body.dataQualityScore)
    if (body.guardianViewCount !== undefined) patch.guardian_view_count = num(body.guardianViewCount)

    const result = await patchDevice(id, patch)

    return NextResponse.json({
      ok: true,
      persisted: result.ok,
      warning: result.ok ? null : result.error || '서버 업데이트에 실패했습니다.',
      device: result.rows[0] ? normalizeDevice(result.rows[0]) : null
    })
  }

  return NextResponse.json(
    {
      ok: false,
      message: '알 수 없는 action입니다.'
    },
    { status: 400 }
  )
}
