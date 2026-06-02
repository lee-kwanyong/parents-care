import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

type Row = Record<string, unknown>

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function code6(value: unknown) {
  return text(value).replace(/[^\d]/g, '').slice(0, 6)
}

function numberValue(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
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
  return result.ok && Array.isArray(result.data) ? (result.data as Row[]) : []
}

async function audit(input: {
  actorName?: string
  actionType: string
  targetType: string
  familyCode?: string
  description: string
  metadata?: Record<string, unknown>
}) {
  await rest('gov_audit_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        actor_name: input.actorName || '운영실',
        actor_role: 'gov_admin',
        action_type: input.actionType,
        target_type: input.targetType,
        family_code: input.familyCode || '',
        description: input.description,
        metadata: input.metadata || {}
      }
    ])
  })
}

function metrics(input: {
  devices: Row[]
  events: Row[]
  pilotSites: Row[]
}) {
  const totalDevices = input.devices.length
  const radarDevices = input.devices.filter((row) => text(row.device_type) === 'uwb_radar').length
  const pillboxDevices = input.devices.filter((row) => text(row.device_type) === 'smart_pillbox').length
  const installedDevices = input.devices.filter((row) => text(row.install_status) === 'installed').length
  const plannedDevices = input.devices.filter((row) => text(row.install_status) !== 'installed').length
  const highRiskEvents = input.events.filter((row) => text(row.risk_level) === 'high').length
  const mediumRiskEvents = input.events.filter((row) => text(row.risk_level) === 'medium').length
  const noActivityEvents = input.events.filter((row) => text(row.event_type) === 'no_activity').length
  const missedMedicationEvents = input.events.filter((row) => text(row.event_type) === 'missed_medication').length
  const fallSignalEvents = input.events.filter((row) => text(row.event_type) === 'fall_signal').length
  const pilotSites = input.pilotSites.length
  const targetHouseholds = input.pilotSites.reduce((sum, row) => sum + numberValue(row.target_households), 0)
  const highRiskHouseholds = input.pilotSites.reduce((sum, row) => sum + numberValue(row.high_risk_households), 0)
  const generalHouseholds = input.pilotSites.reduce((sum, row) => sum + numberValue(row.general_households), 0)

  return {
    totalDevices,
    radarDevices,
    pillboxDevices,
    installedDevices,
    plannedDevices,
    highRiskEvents,
    mediumRiskEvents,
    noActivityEvents,
    missedMedicationEvents,
    fallSignalEvents,
    pilotSites,
    targetHouseholds,
    highRiskHouseholds,
    generalHouseholds
  }
}

function buildMilestones() {
  return [
    {
      phase: '1단계',
      title: '소프트웨어 실증',
      period: '1~2개월',
      desc: '부모님 PWA, 안부지문 리포트, 가족 실행 보드, 지자체 운영실로 100가구 MVP 실증'
    },
    {
      phase: '2단계',
      title: '스마트 복약통 연동',
      period: '3~5개월',
      desc: '일반관리군 중심으로 약통 개폐 로그와 복약 미확인 이벤트를 지자체 대시보드에 연동'
    },
    {
      phase: '3단계',
      title: 'UWB 비접촉 관제',
      period: '6개월 이후',
      desc: '고위험군 중심으로 재실·부재, 무반응, 낙상 의심, 호흡 이상 신호를 실증 데이터로 검증'
    },
    {
      phase: '4단계',
      title: '조달·성과보고 패키지',
      period: '실증 종료',
      desc: '월간 성과지표, 감사로그, 사례관리 기록을 기반으로 지자체 보고서와 R&D 후속 과제 준비'
    }
  ]
}

export async function GET() {
  const [devicesResult, eventsResult, pilotSitesResult] = await Promise.all([
    rest('iot_devices?select=*&order=created_at.desc&limit=500'),
    rest('iot_device_events?select=*&order=occurred_at.desc&limit=500'),
    rest('gov_pilot_sites?select=*&order=created_at.desc&limit=200')
  ])

  const devices = rows(devicesResult)
  const events = rows(eventsResult)
  const pilotSites = rows(pilotSitesResult)

  return NextResponse.json({
    ok: true,
    devices,
    events,
    pilotSites,
    metrics: metrics({ devices, events, pilotSites }),
    milestones: buildMilestones()
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'createDevice') {
    const familyCode = code6(body.familyCode)

    const payload = {
      family_code: familyCode || null,
      recipient_name: text(body.recipientName) || '대상자',
      device_type: text(body.deviceType) || 'smart_pillbox',
      serial_no: text(body.serialNo) || '',
      install_group: text(body.installGroup) || 'B그룹 일반관리',
      install_status: text(body.installStatus) || 'planned',
      installed_at: text(body.installStatus) === 'installed' ? new Date().toISOString() : null,
      assigned_org_name: text(body.assignedOrgName) || '',
      assigned_staff_name: text(body.assignedStaffName) || '',
      privacy_mode: 'no_camera_no_voice',
      payload: body,
      updated_at: new Date().toISOString()
    }

    const result = await rest('iot_devices', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload])
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: 'IoT 장비를 저장하지 못했습니다. Supabase SQL을 실행해주세요.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    await audit({
      actionType: 'create',
      targetType: 'iot_device',
      familyCode,
      description: `IoT 장비 등록: ${payload.device_type}`,
      metadata: payload
    })

    return NextResponse.json({
      ok: true,
      message: 'IoT 장비가 등록되었습니다.',
      device: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (action === 'createEvent') {
    const familyCode = code6(body.familyCode)

    const payload = {
      family_code: familyCode || null,
      device_type: text(body.deviceType) || 'smart_pillbox',
      event_type: text(body.eventType) || 'missed_medication',
      event_label: text(body.eventLabel) || '이상 신호',
      event_status: text(body.eventStatus) || 'detected',
      risk_level: text(body.riskLevel) || 'medium',
      event_value: Number(body.eventValue) || null,
      unit: text(body.unit) || '',
      occurred_at: new Date().toISOString(),
      payload: body
    }

    const result = await rest('iot_device_events', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload])
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: 'IoT 이벤트를 저장하지 못했습니다. Supabase SQL을 실행해주세요.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    await audit({
      actionType: 'create',
      targetType: 'iot_event',
      familyCode,
      description: `IoT 이벤트 등록: ${payload.event_label}`,
      metadata: payload
    })

    return NextResponse.json({
      ok: true,
      message: 'IoT 이벤트가 등록되었습니다.',
      event: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (action === 'createPilotSite') {
    const payload = {
      site_name: text(body.siteName) || '실증 지자체',
      sido: text(body.sido) || '',
      sigungu: text(body.sigungu) || '',
      target_households: Number(body.targetHouseholds) || 100,
      high_risk_households: Number(body.highRiskHouseholds) || 30,
      general_households: Number(body.generalHouseholds) || 70,
      pilot_phase: text(body.pilotPhase) || 'planning',
      budget_estimate_krw: Number(body.budgetEstimateKrw) || 0,
      partner_org_name: text(body.partnerOrgName) || '',
      payload: body,
      updated_at: new Date().toISOString()
    }

    const result = await rest('gov_pilot_sites', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload])
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '실증 지자체 정보를 저장하지 못했습니다. Supabase SQL을 실행해주세요.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    await audit({
      actionType: 'create',
      targetType: 'pilot_site',
      description: `실증 지자체 등록: ${payload.site_name}`,
      metadata: payload
    })

    return NextResponse.json({
      ok: true,
      message: '실증 지자체가 등록되었습니다.',
      pilotSite: Array.isArray(result.data) ? result.data[0] : result.data
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
