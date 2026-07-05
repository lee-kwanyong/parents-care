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

type ReportBuildResult = {
  report: Row
  readings: Row[]
}

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

const HEADER_MAP: Record<string, string> = {
  family_code: 'familyCode',
  familycode: 'familyCode',
  가족코드: 'familyCode',
  parent_name: 'parentName',
  parentname: 'parentName',
  부모님: 'parentName',
  부모님이름: 'parentName',
  guardian_name: 'guardianName',
  guardianname: 'guardianName',
  보호자: 'guardianName',
  보호자이름: 'guardianName',
  guardian_phone: 'guardianPhone',
  guardianphone: 'guardianPhone',
  보호자연락처: 'guardianPhone',
  parent_phone: 'parentPhone',
  parentphone: 'parentPhone',
  부모님연락처: 'parentPhone',
  report_date: 'reportDate',
  reportdate: 'reportDate',
  날짜: 'reportDate',
  date: 'reportDate',
  measured_date: 'reportDate',
  sleep_minutes: 'sleepMinutes',
  sleepminutes: 'sleepMinutes',
  sleep: 'sleepMinutes',
  수면분: 'sleepMinutes',
  수면시간: 'sleepMinutes',
  baseline_sleep_minutes: 'baselineSleepMinutes',
  baselinesleepminutes: 'baselineSleepMinutes',
  평소수면분: 'baselineSleepMinutes',
  평소수면: 'baselineSleepMinutes',
  steps: 'steps',
  걸음: 'steps',
  걸음수: 'steps',
  activity: 'steps',
  baseline_steps: 'baselineSteps',
  baselinesteps: 'baselineSteps',
  평소걸음: 'baselineSteps',
  평소걸음수: 'baselineSteps',
  resting_hr: 'restingHr',
  restinghr: 'restingHr',
  heart_rate: 'restingHr',
  heartrate: 'restingHr',
  hr: 'restingHr',
  심박: 'restingHr',
  안정심박: 'restingHr',
  baseline_resting_hr: 'baselineRestingHr',
  baselinerestinghr: 'baselineRestingHr',
  평소심박: 'baselineRestingHr',
  hrv: 'hrv',
  baseline_hrv: 'baselineHrv',
  baselinehrv: 'baselineHrv',
  평소hrv: 'baselineHrv',
  spo2: 'spo2',
  sp_o2: 'spo2',
  산소포화도: 'spo2',
  혈중산소: 'spo2',
  baseline_spo2: 'baselineSpo2',
  baselinespo2: 'baselineSpo2',
  평소spo2: 'baselineSpo2',
  temperature_delta: 'temperatureDelta',
  temperaturedelta: 'temperatureDelta',
  temp_delta: 'temperatureDelta',
  tempdelta: 'temperatureDelta',
  체온변화: 'temperatureDelta',
  체온추세: 'temperatureDelta',
  wear_minutes: 'wearMinutes',
  wearminutes: 'wearMinutes',
  wearing_minutes: 'wearMinutes',
  wearingminutes: 'wearMinutes',
  착용분: 'wearMinutes',
  착용시간: 'wearMinutes',
  battery: 'batteryLevel',
  battery_level: 'batteryLevel',
  batterylevel: 'batteryLevel',
  배터리: 'batteryLevel',
  battery_percent: 'batteryLevel',
  device_id: 'deviceId',
  deviceid: 'deviceId',
  기기id: 'deviceId',
  device_model: 'deviceModel',
  devicemodel: 'deviceModel',
  모델: 'deviceModel',
  vendor: 'vendor',
  supplier: 'vendor',
  공급사: 'vendor',
  notes: 'notes',
  memo: 'notes',
  메모: 'notes'
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  const cleaned = text(value).replace(/,/g, '').replace(/[^\d.-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : fallback
}

function positive(value: unknown) {
  const n = num(value, 0)
  return n > 0 ? n : 0
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

async function insertRows(table: string, values: Row[]) {
  if (values.length === 0) {
    return {
      ok: true,
      status: 200,
      data: [],
      error: null
    } as RestResult
  }

  return rest(table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(values)
  })
}

function parseCsvLine(line: string) {
  const output: string[] = []
  let current = ''
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === ',' && !quoted) {
      output.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  output.push(current.trim())
  return output
}

function parseCsv(textValue: string) {
  const lines = textValue
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((header) => {
    const compact = header.toLowerCase().replace(/[\s()/_-]/g, '')
    return HEADER_MAP[header] || HEADER_MAP[header.toLowerCase()] || HEADER_MAP[compact] || header
  })

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce<Row>((acc, header, index) => {
      acc[header] = values[index] || ''
      return acc
    }, {})
  })
}

function kstDate() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function toKst(value: unknown) {
  const raw = text(value)
  if (!raw) return ''

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function statusLabel(status: string) {
  if (status === 'normal') return '정상'
  if (status === 'watch') return '주의'
  return '확인필요'
}

function minutesLabel(minutes: number) {
  if (!minutes) return '입력 없음'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h <= 0) return `${m}분`
  return `${h}시간 ${m}분`
}

function deltaPercent(current: number, baseline: number) {
  if (!current || !baseline) return 0
  return Math.round(((current - baseline) / baseline) * 100)
}

function cardStatus(severity: number) {
  if (severity >= 2) return 'check_needed'
  if (severity >= 1) return 'watch'
  return 'normal'
}

function normalizeReport(row: Row) {
  return {
    id: text(row.id),
    familyCode: text(row.family_code),
    parentName: text(row.parent_name),
    guardianName: text(row.guardian_name),
    guardianPhoneLast4: text(row.guardian_phone_last4),
    parentPhoneLast4: text(row.parent_phone_last4),
    reportDate: text(row.report_date),
    overallStatus: text(row.overall_status),
    anbuScore: num(row.anbu_score, 0),
    summaryText: text(row.summary_text),
    recommendedAction: text(row.recommended_action),
    dataQualityScore: num(row.data_quality_score, 0),
    metrics: row.metrics || {},
    cards: Array.isArray(row.cards) ? row.cards : [],
    shareMessage: text(row.share_message),
    source: text(row.source),
    createdBy: text(row.created_by),
    createdAt: text(row.created_at),
    createdKst: toKst(row.created_at)
  }
}

function buildReport(input: Row): ReportBuildResult {
  const familyCode = text(input.familyCode).replace(/[^0-9A-Za-z_-]/g, '').slice(0, 40)
  const parentName = text(input.parentName) || '부모님'
  const guardianName = text(input.guardianName) || '보호자'
  const guardianPhone = phone(input.guardianPhone)
  const parentPhone = phone(input.parentPhone)
  const reportDate = text(input.reportDate) || kstDate()
  const deviceId = text(input.deviceId)
  const deviceModel = text(input.deviceModel) || 'smart-ring'
  const vendor = text(input.vendor) || 'csv'

  const sleepMinutes = positive(input.sleepMinutes)
  const baselineSleepMinutes = positive(input.baselineSleepMinutes)
  const steps = positive(input.steps)
  const baselineSteps = positive(input.baselineSteps)
  const restingHr = positive(input.restingHr)
  const baselineRestingHr = positive(input.baselineRestingHr)
  const hrv = positive(input.hrv)
  const baselineHrv = positive(input.baselineHrv)
  const spo2 = positive(input.spo2)
  const baselineSpo2 = positive(input.baselineSpo2)
  const temperatureDelta = num(input.temperatureDelta, 0)
  const wearMinutes = positive(input.wearMinutes)
  const batteryLevel = positive(input.batteryLevel)
  const notes = text(input.notes)

  let score = 100
  let hard = 0
  let watch = 0
  const reasons: string[] = []
  const cards = []

  let sleepSeverity = 0
  if (sleepMinutes > 0 && baselineSleepMinutes > 0) {
    if (sleepMinutes < baselineSleepMinutes * 0.65 || sleepMinutes < 240) sleepSeverity = 2
    else if (sleepMinutes < baselineSleepMinutes * 0.8) sleepSeverity = 1
  } else if (sleepMinutes === 0) sleepSeverity = 1

  if (sleepSeverity === 2) {
    score -= 18
    hard += 1
    reasons.push('수면이 평소보다 많이 짧음')
  } else if (sleepSeverity === 1) {
    score -= 9
    watch += 1
    reasons.push('수면이 평소보다 짧음')
  }

  cards.push({
    key: 'sleep',
    title: '수면 리듬',
    status: cardStatus(sleepSeverity),
    value: `${minutesLabel(sleepMinutes)}${baselineSleepMinutes ? ` / 평소 ${minutesLabel(baselineSleepMinutes)}` : ''}`,
    detail: baselineSleepMinutes ? `평소 대비 ${deltaPercent(sleepMinutes, baselineSleepMinutes)}% 변화` : '평소 기준선이 필요합니다.'
  })

  let activitySeverity = 0
  if (steps > 0 && baselineSteps > 0) {
    if (steps < baselineSteps * 0.45) activitySeverity = 2
    else if (steps < baselineSteps * 0.7) activitySeverity = 1
  } else if (steps === 0) activitySeverity = 1

  if (activitySeverity === 2) {
    score -= 18
    hard += 1
    reasons.push('활동량이 평소보다 크게 낮음')
  } else if (activitySeverity === 1) {
    score -= 9
    watch += 1
    reasons.push('활동량이 평소보다 낮음')
  }

  cards.push({
    key: 'activity',
    title: '활동 리듬',
    status: cardStatus(activitySeverity),
    value: `${steps ? `${steps.toLocaleString('ko-KR')}보` : '입력 없음'}${baselineSteps ? ` / 평소 ${baselineSteps.toLocaleString('ko-KR')}보` : ''}`,
    detail: baselineSteps ? `평소 대비 ${deltaPercent(steps, baselineSteps)}% 변화` : '평소 기준선이 필요합니다.'
  })

  let heartSeverity = 0
  const hrHigh = restingHr > 0 && baselineRestingHr > 0 && restingHr > baselineRestingHr * 1.18
  const hrvLow = hrv > 0 && baselineHrv > 0 && hrv < baselineHrv * 0.75
  const spo2Low = spo2 > 0 && spo2 < 94

  if (spo2Low) heartSeverity = 2
  else if (hrHigh || hrvLow) heartSeverity = 1

  if (heartSeverity === 2) {
    score -= 16
    hard += 1
    reasons.push('SpO2 또는 심박 리듬 확인 필요')
  } else if (heartSeverity === 1) {
    score -= 8
    watch += 1
    reasons.push('심박·회복 리듬이 평소와 다름')
  }

  cards.push({
    key: 'heart',
    title: '심박·회복 리듬',
    status: cardStatus(heartSeverity),
    value: `HR ${restingHr || '-'} / HRV ${hrv || '-'} / SpO2 ${spo2 || '-'}`,
    detail: '의료 판단이 아닌 평소 리듬 대비 참고 신호입니다.'
  })

  let tempSeverity = 0
  if (Math.abs(temperatureDelta) >= 0.7) tempSeverity = 2
  else if (Math.abs(temperatureDelta) >= 0.4) tempSeverity = 1

  if (tempSeverity === 2) {
    score -= 12
    hard += 1
    reasons.push('체온 추세가 평소와 크게 다름')
  } else if (tempSeverity === 1) {
    score -= 6
    watch += 1
    reasons.push('체온 추세가 평소와 다름')
  }

  cards.push({
    key: 'temperature',
    title: '체온 추세',
    status: cardStatus(tempSeverity),
    value: `${temperatureDelta >= 0 ? '+' : ''}${temperatureDelta.toFixed(1)}℃`,
    detail: '피부온도 또는 체온 추세 변화값 기준입니다.'
  })

  let wearSeverity = 0
  if (wearMinutes < 360) wearSeverity = 2
  else if (wearMinutes < 720) wearSeverity = 1

  if (wearSeverity === 2) {
    score -= 18
    hard += 1
    reasons.push('착용 시간이 짧아 판단 어려움')
  } else if (wearSeverity === 1) {
    score -= 8
    watch += 1
    reasons.push('착용 시간이 다소 짧음')
  }

  cards.push({
    key: 'wear',
    title: '착용 여부',
    status: cardStatus(wearSeverity),
    value: minutesLabel(wearMinutes),
    detail: wearMinutes >= 960 ? '데이터 신뢰도가 좋습니다.' : '하루 16시간 이상 착용하면 신뢰도가 좋아집니다.'
  })

  let batterySeverity = 0
  if (batteryLevel > 0 && batteryLevel < 10) batterySeverity = 2
  else if (batteryLevel > 0 && batteryLevel < 20) batterySeverity = 1

  if (batterySeverity === 2) {
    score -= 8
    hard += 1
    reasons.push('배터리 부족')
  } else if (batterySeverity === 1) {
    score -= 4
    watch += 1
    reasons.push('배터리 충전 권장')
  }

  cards.push({
    key: 'battery',
    title: '배터리',
    status: cardStatus(batterySeverity),
    value: batteryLevel ? `${batteryLevel}%` : '입력 없음',
    detail: batteryLevel && batteryLevel < 20 ? '충전을 권장합니다.' : '충전 상태가 충분합니다.'
  })

  const filled = [
    sleepMinutes,
    baselineSleepMinutes,
    steps,
    baselineSteps,
    restingHr,
    baselineRestingHr,
    hrv,
    baselineHrv,
    spo2,
    temperatureDelta !== 0 ? 1 : 0,
    wearMinutes,
    batteryLevel
  ].filter((value) => Number(value) !== 0).length

  const dataQualityScore = Math.min(100, Math.round((filled / 12) * 100))

  if (dataQualityScore < 45) {
    score = Math.min(score, 58)
    hard += 1
    reasons.push('입력 데이터 부족')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  let overallStatus = 'normal'

  if (hard > 0 || score < 60) overallStatus = 'check_needed'
  else if (watch > 0 || score < 80) overallStatus = 'watch'

  const reasonText = reasons.slice(0, 3).join(', ')

  const summaryText =
    overallStatus === 'normal'
      ? `오늘 ${parentName}의 안부리포트은 평소와 비슷합니다. 수면, 활동, 심박 리듬이 큰 변화 없이 확인됩니다.`
      : overallStatus === 'watch'
        ? `오늘 ${parentName}의 안부리포트이 평소와 조금 다릅니다. ${reasonText || '일부 지표 변화'}가 보여 전화 확인을 권장합니다.`
        : `오늘 ${parentName}의 상태 확인이 필요합니다. ${reasonText || '데이터 부족 또는 평소와 다른 변화'}가 확인되어 보호자 확인을 권장합니다.`

  const recommendedAction =
    overallStatus === 'normal'
      ? '특별한 조치가 필요하지는 않습니다. 평소처럼 짧은 안부 연락을 해주시면 좋습니다.'
      : overallStatus === 'watch'
        ? '오늘 중 전화로 컨디션을 확인하고, 확인 결과를 기록해주세요.'
        : '먼저 전화 확인을 진행하고, 연결이 어렵거나 걱정되는 경우 가족 공유 또는 생활확인 요청을 검토해주세요.'

  const shareMessage =
`[안부웍스] ${parentName} 안부완료 리포트

오늘 상태: ${statusLabel(overallStatus)}
안부리포트 점수: ${score}점

${summaryText}

권장 행동:
${recommendedAction}

본 리포트는 의료 진단이 아닌 가족 안부 참고 신호입니다.
응급상황이 의심되면 즉시 119 또는 의료기관에 연락하세요.`

  const report = {
    family_code: familyCode || null,
    parent_name: parentName,
    guardian_name: guardianName,
    guardian_phone: guardianPhone || null,
    guardian_phone_last4: guardianPhone ? guardianPhone.slice(-4) : null,
    parent_phone: parentPhone || null,
    parent_phone_last4: parentPhone ? parentPhone.slice(-4) : null,
    report_date: reportDate,
    overall_status: overallStatus,
    anbu_score: score,
    summary_text: summaryText,
    recommended_action: recommendedAction,
    data_quality_score: dataQualityScore,
    metrics: {
      sleepMinutes,
      baselineSleepMinutes,
      steps,
      baselineSteps,
      restingHr,
      baselineRestingHr,
      hrv,
      baselineHrv,
      spo2,
      baselineSpo2,
      temperatureDelta,
      wearMinutes,
      batteryLevel,
      notes,
      deviceId,
      deviceModel,
      vendor,
      reasons
    },
    cards,
    timeline: [
      { time: 'CSV', title: '안부리포트 데이터 업로드', desc: `${vendor} ${deviceModel} 데이터 기반` },
      { time: '오늘', title: `${statusLabel(overallStatus)} 리포트 생성`, desc: summaryText }
    ],
    share_message: shareMessage,
    source: 'csv-import',
    created_by: text(input.createdBy) || '운영실'
  }

  const metricRows: Array<[string, number, string]> = [
    ['sleep_minutes', sleepMinutes, 'min'],
    ['baseline_sleep_minutes', baselineSleepMinutes, 'min'],
    ['steps', steps, 'steps'],
    ['baseline_steps', baselineSteps, 'steps'],
    ['resting_hr', restingHr, 'bpm'],
    ['baseline_resting_hr', baselineRestingHr, 'bpm'],
    ['hrv', hrv, 'ms'],
    ['baseline_hrv', baselineHrv, 'ms'],
    ['spo2', spo2, '%'],
    ['baseline_spo2', baselineSpo2, '%'],
    ['temperature_delta', temperatureDelta, 'c'],
    ['wear_minutes', wearMinutes, 'min'],
    ['battery_level', batteryLevel, '%']
  ]

  const readings = metricRows
    .filter(([, value]) => Number.isFinite(value) && value !== 0)
    .map(([metricType, value, unit]) => ({
      family_code: familyCode || null,
      parent_name: parentName,
      device_id: deviceId || null,
      device_model: deviceModel,
      vendor,
      measured_date: reportDate,
      metric_type: metricType,
      value,
      unit,
      raw_payload: input,
      created_by: text(input.createdBy) || '운영실'
    }))

  return { report, readings }
}

async function importCsv(body: Row) {
  const csvText = text(body.csvText)
  const rowsInput = Array.isArray(body.rows) ? body.rows as Row[] : []
  const parsed = rowsInput.length ? rowsInput : parseCsv(csvText)

  if (!parsed.length) {
    return {
      ok: false,
      status: 400,
      message: 'CSV 데이터가 비어 있거나 파싱할 수 없습니다.'
    }
  }

  const createdBy = text(body.createdBy) || '운영실'
  const fileName = text(body.fileName) || 'ring-data.csv'
  const sourceName = text(body.sourceName) || 'csv'

  const batchCreate = await insertRows('ring_csv_import_batches', [
    {
      source_name: sourceName,
      file_name: fileName,
      row_count: parsed.length,
      success_count: 0,
      failed_count: 0,
      raw_preview: csvText.slice(0, 3000),
      payload: {
        headers: parsed[0] ? Object.keys(parsed[0]) : [],
        startedAt: new Date().toISOString()
      },
      created_by: createdBy
    }
  ])

  if (!batchCreate.ok) {
    return {
      ok: false,
      status: 500,
      message: '업로드 배치 생성에 실패했습니다.',
      detail: batchCreate.error
    }
  }

  const batch = rows(batchCreate)[0]
  const batchId = text(batch.id)
  const errors: Row[] = []
  const savedReports: Row[] = []
  const allReadings: Row[] = []

  for (let index = 0; index < parsed.length; index += 1) {
    const row = {
      ...parsed[index],
      createdBy
    }

    try {
      const built = buildReport(row)

      if (!text(built.report.family_code)) {
        errors.push({ row: index + 2, message: 'familyCode가 없습니다.', payload: parsed[index] })
        continue
      }

      const reportInsert = await insertRows('ring_daily_reports', [built.report])

      if (!reportInsert.ok) {
        errors.push({ row: index + 2, message: '리포트 저장 실패', detail: reportInsert.error, payload: parsed[index] })
        continue
      }

      const saved = rows(reportInsert)[0]
      savedReports.push(saved)

      for (const reading of built.readings) {
        allReadings.push({
          ...reading,
          batch_id: batchId,
          report_id: text(saved.id)
        })
      }
    } catch (error) {
      errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        payload: parsed[index]
      })
    }
  }

  const readingResult = await insertRows('ring_device_readings', allReadings)

  if (!readingResult.ok) {
    errors.push({
      row: 0,
      message: '원시 데이터 저장 실패',
      detail: readingResult.error
    })
  }

  const reportIds = savedReports.map((report) => text(report.id))

  await rest('ring_csv_import_batches?id=eq.' + encodeURIComponent(batchId), {
    method: 'PATCH',
    body: JSON.stringify({
      success_count: savedReports.length,
      failed_count: errors.length,
      report_ids: reportIds,
      errors,
      payload: {
        headers: parsed[0] ? Object.keys(parsed[0]) : [],
        completedAt: new Date().toISOString(),
        readingCount: allReadings.length
      }
    })
  })

  return {
    ok: true,
    message: `CSV 업로드 완료: 리포트 ${savedReports.length}건 생성, 실패 ${errors.length}건`,
    batchId,
    metrics: {
      rowCount: parsed.length,
      successCount: savedReports.length,
      failedCount: errors.length,
      readingCount: allReadings.length
    },
    reports: savedReports.map(normalizeReport),
    errors
  }
}

async function dashboard() {
  const [batchResult, reportResult] = await Promise.all([
    rest('ring_csv_import_batches?select=*&order=created_at.desc&limit=100'),
    rest('ring_daily_reports?select=*&source=eq.csv-import&order=created_at.desc&limit=100')
  ])

  return {
    ok: true,
    batches: rows(batchResult).map((item) => ({
      id: text(item.id),
      sourceName: text(item.source_name),
      fileName: text(item.file_name),
      rowCount: num(item.row_count, 0),
      successCount: num(item.success_count, 0),
      failedCount: num(item.failed_count, 0),
      createdBy: text(item.created_by),
      createdKst: toKst(item.created_at),
      errors: item.errors || []
    })),
    reports: rows(reportResult).map(normalizeReport),
    sourceErrors: {
      batches: batchResult.ok ? null : batchResult.error,
      reports: reportResult.ok ? null : reportResult.error
    }
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

  const data = await dashboard()
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

  if (action === 'importCsv') result = await importCsv(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
