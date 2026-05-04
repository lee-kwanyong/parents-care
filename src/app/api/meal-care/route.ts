import { NextRequest, NextResponse } from 'next/server'
import {
  buildMealEvents,
  durationForSupportType,
  inferMealPriority,
  normalizeMealTimes,
  type DeliveryStatus,
  type MealDietType,
  type MealRequestStatus,
  type MealStatus,
  type MealSupportType
} from '@/lib/meal-care-engine'

export const dynamic = 'force-dynamic'

const allowedSupportTypes = new Set(['check_only', 'regular_delivery', 'recovery_7days', 'diet_consult', 'social_support'])
const allowedDietTypes = new Set(['normal', 'soft_food', 'porridge', 'low_sodium', 'diabetes_friendly', 'post_discharge_recovery', 'unknown'])
const allowedRequestStatuses = new Set(['requested', 'reviewing', 'active', 'paused', 'completed', 'cancelled'])
const allowedMealStatuses = new Set(['planned', 'delivered', 'eaten', 'not_eaten', 'needs_help', 'skipped', 'failed'])
const allowedDeliveryStatuses = new Set(['none', 'scheduled', 'delivered', 'failed'])

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 'on'
}

function numberOrNull(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase env is missing' }
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
    return { ok: false, data: parsed, error: parsed || bodyText }
  }

  return { ok: true, data: parsed, error: null }
}

export async function GET() {
  const requestSelect = [
    'id',
    'elder_name',
    'guardian_name',
    'guardian_phone',
    'support_type',
    'diet_type',
    'meal_times',
    'start_date',
    'end_date',
    'delivery_address',
    'delivery_note',
    'social_care_requested',
    'status',
    'priority',
    'memo',
    'ops_memo',
    'completed_at',
    'created_at',
    'updated_at'
  ].join(',')

  const eventSelect = [
    'id',
    'meal_support_request_id',
    'event_date',
    'meal_time',
    'meal_status',
    'delivery_status',
    'check_source',
    'memo',
    'ops_memo',
    'checked_at',
    'created_at',
    'updated_at'
  ].join(',')

  const [requests, events] = await Promise.all([
    rest('care_meal_support_requests?select=' + encodeURIComponent(requestSelect) + '&order=created_at.desc&limit=100'),
    rest('care_meal_service_events?select=' + encodeURIComponent(eventSelect) + '&order=event_date.asc,meal_time.asc&limit=500')
  ])

  if (!requests.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안심밥상 요청 목록을 불러오지 못했습니다. STEP18 SQL이 실행됐는지 확인해주세요.',
        detail: requests.error
      },
      { status: 500 }
    )
  }

  if (!events.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '식사 체크 목록을 불러오지 못했습니다. STEP18 SQL이 실행됐는지 확인해주세요.',
        detail: events.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    requests: Array.isArray(requests.data) ? requests.data : [],
    events: Array.isArray(events.data) ? events.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const elderName = text(body.elderName) || '부모님'
  const guardianName = text(body.guardianName)
  const guardianPhone = text(body.guardianPhone)
  const supportTypeValue = text(body.supportType) || 'check_only'
  const dietTypeValue = text(body.dietType) || 'unknown'

  if (!allowedSupportTypes.has(supportTypeValue)) {
    return NextResponse.json({ ok: false, message: 'supportType이 올바르지 않습니다.' }, { status: 400 })
  }

  if (!allowedDietTypes.has(dietTypeValue)) {
    return NextResponse.json({ ok: false, message: 'dietType이 올바르지 않습니다.' }, { status: 400 })
  }

  const supportType = supportTypeValue as MealSupportType
  const dietType = dietTypeValue as MealDietType
  const mealTimes = normalizeMealTimes(body.mealTimes)
  const startDate = text(body.startDate) || new Date().toISOString().slice(0, 10)
  const durationDays = durationForSupportType(supportType, numberOrNull(body.durationDays))
  const endDate = new Date(new Date(startDate + 'T09:00:00').getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const socialCareRequested = bool(body.socialCareRequested)
  const deliveryAddress = text(body.deliveryAddress)
  const deliveryNote = text(body.deliveryNote)
  const memo = text(body.memo)
  const priority = inferMealPriority({ supportType, dietType, socialCareRequested })

  const requestInsert = await rest('care_meal_support_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: elderName,
        guardian_name: guardianName || null,
        guardian_phone: guardianPhone || null,
        support_type: supportType,
        diet_type: dietType,
        meal_times: mealTimes,
        start_date: startDate,
        end_date: endDate,
        delivery_address: deliveryAddress || null,
        delivery_note: deliveryNote || null,
        social_care_requested: socialCareRequested,
        status: supportType === 'check_only' ? 'active' : 'requested',
        priority,
        memo: memo || null,
        created_by_role: 'family'
      }
    ])
  })

  if (!requestInsert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안심밥상 요청 저장 중 오류가 발생했습니다.',
        detail: requestInsert.error
      },
      { status: 500 }
    )
  }

  const savedRequest = Array.isArray(requestInsert.data) ? requestInsert.data[0] : null

  if (!savedRequest?.id) {
    return NextResponse.json({ ok: false, message: '저장된 식사 요청 정보를 찾지 못했습니다.' }, { status: 500 })
  }

  const eventRows = buildMealEvents({
    requestId: savedRequest.id,
    supportType,
    startDate,
    mealTimes,
    durationDays
  })

  const eventInsert = await rest('care_meal_service_events', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(eventRows)
  })

  if (!eventInsert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '식사 체크 생성 중 오류가 발생했습니다.',
        detail: eventInsert.error
      },
      { status: 500 }
    )
  }

  await rest('family_action_items?on_conflict=dedupe_key', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
    body: JSON.stringify([
      {
        title: `${elderName} 식사 케어 확인하기`,
        description: `${elderName} 안심밥상 요청이 만들어졌습니다. 식사 상태와 배송 필요 여부를 확인해주세요.`,
        category: 'meal',
        priority,
        status: 'pending',
        source_type: 'care_plan',
        source_id: savedRequest.id,
        dedupe_key: `meal-care:${savedRequest.id}:start`,
        created_by_role: 'system',
        memo: memo || null
      }
    ])
  })

  return NextResponse.json({
    ok: true,
    request: savedRequest,
    events: Array.isArray(eventInsert.data) ? eventInsert.data : []
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const kind = text(body.kind)
  const id = text(body.id)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (kind === 'request') {
    const statusValue = text(body.status)

    if (!allowedRequestStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'request status가 올바르지 않습니다.' }, { status: 400 })
    }

    const status = statusValue as MealRequestStatus
    const opsMemo = text(body.opsMemo)

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (opsMemo) patch.ops_memo = opsMemo
    if (status === 'completed') patch.completed_at = new Date().toISOString()

    const result = await rest('care_meal_support_requests?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '식사 요청 상태 변경 실패', detail: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, item: Array.isArray(result.data) ? result.data[0] : result.data })
  }

  if (kind === 'event') {
    const mealStatusValue = text(body.mealStatus)
    const deliveryStatusValue = text(body.deliveryStatus)
    const memo = text(body.memo)

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (mealStatusValue) {
      if (!allowedMealStatuses.has(mealStatusValue)) {
        return NextResponse.json({ ok: false, message: 'mealStatus가 올바르지 않습니다.' }, { status: 400 })
      }

      patch.meal_status = mealStatusValue as MealStatus
      patch.checked_at = new Date().toISOString()
      patch.check_source = 'family'
    }

    if (deliveryStatusValue) {
      if (!allowedDeliveryStatuses.has(deliveryStatusValue)) {
        return NextResponse.json({ ok: false, message: 'deliveryStatus가 올바르지 않습니다.' }, { status: 400 })
      }

      patch.delivery_status = deliveryStatusValue as DeliveryStatus

      if (deliveryStatusValue === 'delivered' && !mealStatusValue) {
        patch.meal_status = 'delivered'
      }
    }

    if (memo) patch.memo = memo

    const result = await rest('care_meal_service_events?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '식사 체크 상태 변경 실패', detail: result.error }, { status: 500 })
    }

    const updated = Array.isArray(result.data) ? result.data[0] : result.data

    if (updated?.id && ['not_eaten', 'needs_help', 'failed'].includes(updated.meal_status)) {
      await rest('family_action_items?on_conflict=dedupe_key', {
        method: 'POST',
        headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
        body: JSON.stringify([
          {
            title: '부모님 식사 상태 확인하기',
            description: '식사를 못 드셨거나 도움이 필요하다고 표시되었습니다. 가족 확인이 필요합니다.',
            category: 'meal',
            priority: updated.meal_status === 'needs_help' ? 'urgent' : 'high',
            status: 'pending',
            source_type: 'care_plan',
            source_id: updated.id,
            dedupe_key: `meal-event:${updated.id}:attention`,
            created_by_role: 'system',
            memo: updated.memo || null
          }
        ])
      })
    }

    if (updated?.id && updated.delivery_status === 'failed') {
      await rest('family_action_items?on_conflict=dedupe_key', {
        method: 'POST',
        headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
        body: JSON.stringify([
          {
            title: '식사 배송 문제 확인하기',
            description: '식사 배송이 실패로 표시되었습니다. 운영실 확인이 필요합니다.',
            category: 'meal',
            priority: 'high',
            status: 'pending',
            source_type: 'care_plan',
            source_id: updated.id,
            dedupe_key: `meal-event:${updated.id}:delivery-failed`,
            created_by_role: 'system',
            memo: updated.ops_memo || null
          }
        ])
      })
    }

    return NextResponse.json({ ok: true, item: updated })
  }

  return NextResponse.json({ ok: false, message: 'kind는 request 또는 event여야 합니다.' }, { status: 400 })
}
