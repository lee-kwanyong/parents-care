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

type SignalConfig = {
  signalType: string
  signalLabel: string
  requestType: string
  riskLevel: 'low' | 'medium' | 'high'
  status: 'completed' | 'open'
  requestedAction: string
}

const signals: Record<string, SignalConfig> = {
  ok: {
    signalType: 'daily_ok',
    signalLabel: '괜찮아요',
    requestType: 'daily_checkin',
    riskLevel: 'low',
    status: 'completed',
    requestedAction: '부모님이 오늘 괜찮다고 응답했습니다. 보호자 리포트에 반영하세요.'
  },
  meal: {
    signalType: 'meal_missed',
    signalLabel: '밥을 못 먹었어요',
    requestType: 'meal_delivery',
    riskLevel: 'medium',
    status: 'open',
    requestedAction: '보호자에게 식사 확인을 요청하고, 필요 시 지역상점·도시락·돌봄파트너 연결을 검토하세요.'
  },
  medication: {
    signalType: 'medication_missed',
    signalLabel: '약을 못 먹었어요',
    requestType: 'medication_reminder',
    riskLevel: 'medium',
    status: 'open',
    requestedAction: '보호자에게 복약 확인을 요청하고, 필요 시 약국 상담 또는 돌봄파트너 확인을 연결하세요.'
  },
  sick: {
    signalType: 'feeling_sick',
    signalLabel: '몸이 아파요',
    requestType: 'care_partner_check',
    riskLevel: 'high',
    status: 'open',
    requestedAction: '보호자 전화 확인을 우선하고, 필요 시 요양보호사·돌봄파트너 확인 요청을 진행하세요. 응급상황이 의심되면 119 또는 의료기관 연락을 안내하세요.'
  },
  urgent: {
    signalType: 'urgent_neighbor_help',
    signalLabel: '지금 도움이 필요해요',
    requestType: 'urgent_neighbor_help',
    riskLevel: 'high',
    status: 'open',
    requestedAction: '운영실이 즉시 확인하고 가까운 요양보호사·돌봄파트너 배치를 검토하세요. 응급상황이 의심되면 119 또는 의료기관 연락을 안내하세요.'
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
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

function sourceKey(body: Row, signal: SignalConfig) {
  const familyCode = text(body.familyCode)
  const parentName = text(body.parentName)
  const minute = new Date().toISOString().slice(0, 16)

  return createHash('sha256')
    .update([familyCode, parentName, signal.signalType, minute].join(':'))
    .digest('hex')
    .slice(0, 24)
}

async function createMobileSignal(request: NextRequest, body: Row) {
  if (text(body.website)) {
    return {
      ok: true,
      message: '신호가 접수되었습니다.'
    }
  }

  const signal = signals[text(body.signalType)]

  if (!signal) {
    return {
      ok: false,
      status: 400,
      message: '알 수 없는 안부 신호입니다.'
    }
  }

  const familyCode = text(body.familyCode).replace(/[^\dA-Za-z]/g, '').slice(0, 12)
  const parentName = text(body.parentName) || '부모님'
  const guardianPhone = phone(body.guardianPhone)
  const serviceArea = text(body.serviceArea) || '우리동네'

  if (!familyCode) {
    return {
      ok: false,
      status: 400,
      message: '가족코드가 필요합니다.'
    }
  }

  const now = new Date().toISOString()
  const uniqueSourceKey = 'mobile-signal-' + sourceKey(body, signal)

  const existing = await rest('care_response_requests?select=*&source_key=eq.' + encodeURIComponent(uniqueSourceKey) + '&limit=1')
  const existingRow = rows(existing)[0]

  if (existingRow) {
    return {
      ok: true,
      message: '이미 같은 안부 신호가 접수되었습니다.',
      request: existingRow,
      duplicate: true
    }
  }

  const result = await insertRows('care_response_requests', [
    {
      family_code: familyCode,
      parent_name: parentName,
      parent_phone: phone(body.parentPhone),
      guardian_name: text(body.guardianName) || '보호자',
      guardian_phone: guardianPhone,
      signal_type: signal.signalType,
      signal_label: signal.signalLabel,
      request_type: signal.requestType,
      risk_level: signal.riskLevel,
      status: signal.status,
      service_area: serviceArea,
      address_hint: text(body.addressHint),
      requested_action: signal.requestedAction,
      dispatch_scope: signal.signalType === 'urgent_neighbor_help' ? 'caregiver_fast_dispatch_ready' : 'family_first',
      source: 'mobile_app',
      source_key: uniqueSourceKey,
      fast_dispatch_status: signal.signalType === 'urgent_neighbor_help' ? 'none' : null,
      completed_at: signal.status === 'completed' ? now : null,
      payload: {
        source: 'mobile-parent-app',
        userAgent: request.headers.get('user-agent') || '',
        original: body
      },
      updated_at: now
    }
  ])

  const created = rows(result)[0]

  if (!result.ok || !created) {
    return {
      ok: false,
      status: 500,
      message: '안부 신호 접수에 실패했습니다.',
      detail: result.error
    }
  }

  await insertRows('care_response_updates', [
    {
      request_id: created.id,
      actor_type: 'parent',
      actor_name: parentName,
      update_type: 'mobile_signal_created',
      message: `${parentName}님이 모바일 앱에서 “${signal.signalLabel}” 신호를 보냈습니다.`,
      payload: {
        signal
      }
    }
  ])

  await insertRows('ops_autopilot_logs', [
    {
      request_id: created.id,
      action_type: 'mobile_signal_created',
      actor_name: '모바일 앱',
      message: `모바일 앱 신호 접수: ${signal.signalLabel}`,
      payload: {
        signal,
        requestId: created.id
      }
    }
  ])

  let outbox: Row | null = null

  if (guardianPhone) {
    const outboxResult = await insertRows('notification_outbox', [
      {
        family_code: familyCode,
        channel: 'sms',
        to_name: text(body.guardianName) || '보호자',
        to_phone: guardianPhone,
        title: '[안부웍스] 부모님 안부 신호',
        body: [
          `${parentName}님이 안부웍스 앱에서 신호를 보냈습니다.`,
          '',
          `상태: ${signal.signalLabel}`,
          `권역: ${serviceArea}`,
          '',
          signal.signalType === 'urgent_neighbor_help'
            ? '운영실과 보호자가 즉시 확인해야 합니다. 응급상황이면 119 또는 의료기관에 연락해주세요.'
            : '보호자 화면에서 후속조치를 확인해주세요.',
          '',
          'https://parents-care.net/mobile/guardian'
        ].join('\n'),
        template_code: 'mobile-signal-guardian',
        reason: 'mobile-signal-guardian',
        target_url: '/mobile/guardian',
        status: 'queued',
        provider: 'mobile-signal',
        source_key: `mobile-signal-guardian-${created.id}`,
        payload: {
          source: 'mobile-parent-app',
          requestId: created.id,
          signalType: signal.signalType
        }
      }
    ])

    outbox = rows(outboxResult)[0] || null
  }

  return {
    ok: true,
    message:
      signal.signalType === 'urgent_neighbor_help'
        ? '긴급 도움 요청이 접수되었습니다. 보호자와 운영실이 확인합니다. 응급상황이면 즉시 119에 연락하세요.'
        : '안부 신호가 접수되었습니다. 보호자에게 알림 대기열이 생성되었습니다.',
    request: created,
    outbox
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const result = await createMobileSignal(request, body)
  return NextResponse.json(result, { status: result.ok ? 200 : Number(result.status || 500) })
}
