import { NextRequest, NextResponse } from 'next/server'
import {
  buildDefaultGuardianMessage,
  calculateCostTotal,
  type ApprovalMethod,
  type CostApprovalStatus,
  type CostItemType,
  type CostPriority,
  type CostSourceType
} from '@/lib/cost-approval-engine'

export const dynamic = 'force-dynamic'

const allowedSourceTypes = new Set(['appointment', 'meal_care', 'documents', 'discharge_care', 'manager_field', 'social_support', 'manual'])
const allowedStatuses = new Set(['draft', 'pending_guardian', 'approved', 'rejected', 'payment_pending', 'paid', 'cancelled', 'expired'])
const allowedPriorities = new Set(['low', 'normal', 'high', 'urgent'])
const allowedMethods = new Set(['app', 'phone', 'kakao', 'ops'])
const allowedItemTypes = new Set(['taxi_fare', 'document_fee', 'meal_delivery', 'mobility_partner', 'extra_time', 'medicine_copay', 'hospital_out_of_pocket', 'parking', 'other'])

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
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
    'title',
    'reason',
    'source_type',
    'source_id',
    'status',
    'priority',
    'total_amount_krw',
    'approved_amount_krw',
    'currency',
    'approval_required',
    'approval_method',
    'guardian_message',
    'approved_by_name',
    'rejected_reason',
    'due_at',
    'approved_at',
    'rejected_at',
    'paid_at',
    'memo',
    'ops_memo',
    'created_at',
    'updated_at'
  ].join(',')

  const itemSelect = [
    'id',
    'cost_approval_request_id',
    'item_type',
    'label',
    'quantity',
    'unit_amount_krw',
    'amount_krw',
    'memo',
    'created_at'
  ].join(',')

  const eventSelect = [
    'id',
    'cost_approval_request_id',
    'event_type',
    'title',
    'description',
    'actor_role',
    'created_at'
  ].join(',')

  const [requests, items, events] = await Promise.all([
    rest('care_cost_approval_requests?select=' + encodeURIComponent(requestSelect) + '&order=created_at.desc&limit=100'),
    rest('care_cost_approval_items?select=' + encodeURIComponent(itemSelect) + '&order=created_at.asc&limit=500'),
    rest('care_cost_approval_events?select=' + encodeURIComponent(eventSelect) + '&order=created_at.desc&limit=300')
  ])

  if (!requests.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '비용 승인 목록을 불러오지 못했습니다. STEP23 SQL이 실행됐는지 확인해주세요.',
        detail: requests.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    requests: Array.isArray(requests.data) ? requests.data : [],
    items: items.ok && Array.isArray(items.data) ? items.data : [],
    events: events.ok && Array.isArray(events.data) ? events.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const elderName = text(body.elderName) || '부모님'
  const guardianName = text(body.guardianName)
  const guardianPhone = text(body.guardianPhone)
  const title = text(body.title) || '추가비용 사전승인'
  const reason = text(body.reason)
  const sourceTypeValue = text(body.sourceType) || 'manual'
  const sourceId = text(body.sourceId)
  const priorityValue = text(body.priority) || 'normal'
  const approvalMethodValue = text(body.approvalMethod) || 'app'
  const dueAt = text(body.dueAt)

  const sourceType: CostSourceType = allowedSourceTypes.has(sourceTypeValue) ? (sourceTypeValue as CostSourceType) : 'manual'
  const priority: CostPriority = allowedPriorities.has(priorityValue) ? (priorityValue as CostPriority) : 'normal'
  const approvalMethod: ApprovalMethod = allowedMethods.has(approvalMethodValue) ? (approvalMethodValue as ApprovalMethod) : 'app'

  const rawItems = Array.isArray(body.items) ? body.items : []

  const items = rawItems.length > 0
    ? rawItems
    : [
        {
          itemType: 'other',
          label: title,
          quantity: 1,
          amountKrw: numberValue(body.amountKrw, 0),
          memo: reason
        }
      ]

  const normalizedItems = items
    .map((item: any) => {
      const itemTypeValue = text(item.itemType) || 'other'
      const itemType: CostItemType = allowedItemTypes.has(itemTypeValue) ? (itemTypeValue as CostItemType) : 'other'
      const quantity = numberValue(item.quantity, 1) || 1
      const unitAmount = numberValue(item.unitAmountKrw, 0)
      const directAmount = numberValue(item.amountKrw, 0)
      const amount = directAmount > 0 ? directAmount : Math.round(unitAmount * quantity)

      return {
        item_type: itemType,
        label: text(item.label) || '추가비용',
        quantity,
        unit_amount_krw: unitAmount > 0 ? unitAmount : amount,
        amount_krw: amount,
        memo: text(item.memo) || null
      }
    })
    .filter((item: any) => item.amount_krw > 0)

  if (normalizedItems.length === 0) {
    return NextResponse.json({ ok: false, message: '승인 요청할 비용 항목이 필요합니다.' }, { status: 400 })
  }

  const totalAmount = calculateCostTotal(normalizedItems)

  const guardianMessage =
    text(body.guardianMessage) ||
    buildDefaultGuardianMessage({
      elderName,
      title,
      totalAmountKrw: totalAmount,
      reason
    })

  const insert = await rest('care_cost_approval_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: elderName,
        guardian_name: guardianName || null,
        guardian_phone: guardianPhone || null,
        title,
        reason: reason || null,
        source_type: sourceType,
        source_id: sourceId && isUuid(sourceId) ? sourceId : null,
        status: 'pending_guardian',
        priority,
        total_amount_krw: totalAmount,
        currency: 'KRW',
        approval_required: true,
        approval_method: approvalMethod,
        guardian_message: guardianMessage,
        requested_by_role: 'ops',
        due_at: dueAt || null,
        memo: text(body.memo) || null,
        ops_memo: text(body.opsMemo) || null
      }
    ])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '비용 승인 요청 저장 중 오류가 발생했습니다.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  const saved = Array.isArray(insert.data) ? insert.data[0] : null

  if (!saved?.id) {
    return NextResponse.json({ ok: false, message: '저장된 비용 승인 요청을 찾지 못했습니다.' }, { status: 500 })
  }

  const itemRows = normalizedItems.map((item: any) => ({
    cost_approval_request_id: saved.id,
    ...item
  }))

  const itemInsert = await rest('care_cost_approval_items', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(itemRows)
  })

  if (!itemInsert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '비용 항목 저장 중 오류가 발생했습니다.',
        detail: itemInsert.error
      },
      { status: 500 }
    )
  }

  await rest('care_cost_approval_events', {
    method: 'POST',
    body: JSON.stringify([
      {
        cost_approval_request_id: saved.id,
        event_type: 'cost_approval_requested',
        title: '추가비용 사전승인 요청',
        description: guardianMessage,
        actor_role: 'ops'
      }
    ])
  })

  await rest('family_action_items?on_conflict=dedupe_key', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
    body: JSON.stringify([
      {
        title: `${elderName} 추가비용 승인하기`,
        description: guardianMessage,
        category: 'general',
        priority,
        status: 'pending',
        source_type: 'manual',
        source_id: null,
        dedupe_key: `cost-approval:${saved.id}:guardian`,
        created_by_role: 'system',
        memo: reason || null
      }
    ])
  })

  return NextResponse.json({
    ok: true,
    request: saved,
    items: Array.isArray(itemInsert.data) ? itemInsert.data : []
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const id = text(body.id)
  const statusValue = text(body.status)
  const approvedByName = text(body.approvedByName)
  const rejectedReason = text(body.rejectedReason)
  const opsMemo = text(body.opsMemo)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (!allowedStatuses.has(statusValue)) {
    return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
  }

  const status = statusValue as CostApprovalStatus

  const currentResult = await rest(
    'care_cost_approval_requests?select=' +
      encodeURIComponent('id,total_amount_krw,status,title,elder_name') +
      '&id=eq.' +
      encodeURIComponent(id) +
      '&limit=1'
  )

  if (!currentResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '비용 승인 요청 조회 실패',
        detail: currentResult.error
      },
      { status: 500 }
    )
  }

  const current = Array.isArray(currentResult.data) ? currentResult.data[0] : null

  if (!current) {
    return NextResponse.json({ ok: false, message: '비용 승인 요청을 찾지 못했습니다.' }, { status: 404 })
  }

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'approved') {
    patch.approved_at = new Date().toISOString()
    patch.approved_amount_krw = current.total_amount_krw
    patch.approved_by_name = approvedByName || '보호자'
  }

  if (status === 'rejected') {
    patch.rejected_at = new Date().toISOString()
    patch.rejected_reason = rejectedReason || '보호자가 승인하지 않았습니다.'
  }

  if (status === 'paid') {
    if (current.status !== 'approved' && current.status !== 'payment_pending') {
      return NextResponse.json(
        {
          ok: false,
          message: '보호자 승인 전에는 결제 완료로 변경할 수 없습니다.'
        },
        { status: 400 }
      )
    }

    patch.paid_at = new Date().toISOString()
  }

  if (status === 'payment_pending') {
    if (current.status !== 'approved') {
      return NextResponse.json(
        {
          ok: false,
          message: '보호자 승인 후에만 결제 대기로 변경할 수 있습니다.'
        },
        { status: 400 }
      )
    }
  }

  if (opsMemo) patch.ops_memo = opsMemo

  const result = await rest('care_cost_approval_requests?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '비용 승인 상태 변경 실패',
        detail: result.error
      },
      { status: 500 }
    )
  }

  await rest('care_cost_approval_events', {
    method: 'POST',
    body: JSON.stringify([
      {
        cost_approval_request_id: id,
        event_type: `cost_${status}`,
        title: `비용 승인 상태 변경: ${status}`,
        description: rejectedReason || opsMemo || null,
        actor_role: status === 'approved' || status === 'rejected' ? 'family' : 'ops'
      }
    ])
  })

  return NextResponse.json({
    ok: true,
    item: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
