import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const allowedStatuses = new Set(['pending', 'claimed', 'done', 'delegated', 'cancelled'])
const allowedPriorities = new Set(['low', 'normal', 'high', 'urgent'])
const allowedCategories = new Set([
  'meal',
  'medication',
  'condition',
  'safe_return',
  'documents',
  'appointment',
  'care_plan',
  'social_support',
  'emergency',
  'general'
])

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
  const select = [
    'id',
    'title',
    'description',
    'category',
    'priority',
    'status',
    'assigned_to_name',
    'assigned_to_phone',
    'source_type',
    'source_id',
    'dedupe_key',
    'due_at',
    'claimed_at',
    'completed_at',
    'delegated_at',
    'memo',
    'created_at',
    'updated_at'
  ].join(',')

  const result = await rest(
    'family_action_items?select=' +
      encodeURIComponent(select) +
      '&order=created_at.desc&limit=100'
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 할 일을 불러오지 못했습니다. STEP14 SQL이 실행됐는지 확인해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    items: Array.isArray(result.data) ? result.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const title = text(body.title)
  const description = text(body.description)
  const category = text(body.category) || 'general'
  const priority = text(body.priority) || 'normal'
  const assignedToName = text(body.assignedToName)
  const assignedToPhone = text(body.assignedToPhone)
  const memo = text(body.memo)

  if (!title) {
    return NextResponse.json({ ok: false, message: '할 일 제목이 필요합니다.' }, { status: 400 })
  }

  if (!allowedCategories.has(category)) {
    return NextResponse.json({ ok: false, message: 'category가 올바르지 않습니다.' }, { status: 400 })
  }

  if (!allowedPriorities.has(priority)) {
    return NextResponse.json({ ok: false, message: 'priority가 올바르지 않습니다.' }, { status: 400 })
  }

  const insert = await rest('family_action_items', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        title,
        description: description || null,
        category,
        priority,
        status: assignedToName ? 'claimed' : 'pending',
        assigned_to_name: assignedToName || null,
        assigned_to_phone: assignedToPhone || null,
        source_type: 'manual',
        created_by_role: 'family',
        memo: memo || null,
        claimed_at: assignedToName ? new Date().toISOString() : null
      }
    ])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 할 일 저장 중 오류가 발생했습니다.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    item: Array.isArray(insert.data) ? insert.data[0] : insert.data
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const id = text(body.id)
  const action = text(body.action)
  const assigneeName = text(body.assigneeName)
  const assigneePhone = text(body.assigneePhone)
  const memo = text(body.memo)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (action === 'claim') {
    patch.status = 'claimed'
    patch.assigned_to_name = assigneeName || '가족'
    patch.assigned_to_phone = assigneePhone || null
    patch.claimed_at = new Date().toISOString()
  } else if (action === 'complete') {
    patch.status = 'done'
    patch.completed_at = new Date().toISOString()
    if (memo) patch.memo = memo
  } else if (action === 'delegate') {
    patch.status = 'delegated'
    patch.assigned_to_name = assigneeName || null
    patch.assigned_to_phone = assigneePhone || null
    patch.delegated_at = new Date().toISOString()
    if (memo) patch.memo = memo
  } else if (action === 'cancel') {
    patch.status = 'cancelled'
    if (memo) patch.memo = memo
  } else if (allowedStatuses.has(action)) {
    patch.status = action
  } else {
    return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
  }

  const result = await rest('family_action_items?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 할 일 변경 중 오류가 발생했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    item: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
