import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null as any,
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

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    status: response.status,
    data: parsed,
    error: null
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeItem(row: AnyRow, source: 'care_assisted_intake_requests' | 'care_intake_entries') {
  const elderName =
    text(row.elder_name) ||
    text(row.parent_name) ||
    text(row.parentName) ||
    text(row.elderName) ||
    '부모님'

  const contactName =
    text(row.contact_name) ||
    text(row.guardian_name) ||
    text(row.guardianName) ||
    text(row.protector_name) ||
    text(row.family_name) ||
    '보호자'

  const contactPhone =
    text(row.contact_phone) ||
    text(row.guardian_phone) ||
    text(row.guardianPhone) ||
    text(row.phone) ||
    ''

  const rawText =
    text(row.raw_text) ||
    text(row.situation_memo) ||
    text(row.situationMemo) ||
    text(row.memo) ||
    text(row.message) ||
    text(row.description) ||
    ''

  const summaryTitle =
    text(row.summary_title) ||
    text(row.title) ||
    text(row.worry_type) ||
    text(row.category) ||
    (rawText ? rawText.slice(0, 44) : `${elderName} 걱정 접수`)

  const status = text(row.ops_status) || text(row.status) || 'received'
  const priority = text(row.priority) || (row.social_care_requested ? 'high' : 'normal')
  const channel = text(row.channel) || text(row.preferred_response_channel) || 'memo'

  return {
    id: String(row.id || ''),
    source,
    elder_name: elderName,
    contact_name: contactName,
    contact_phone: contactPhone,
    channel,
    summary_title: summaryTitle,
    raw_text: rawText,
    status,
    priority,
    social_care_requested: Boolean(row.social_care_requested),
    created_at: row.created_at || new Date().toISOString()
  }
}

async function getAssistedIntakeItems() {
  const select = [
    'id',
    'elder_name',
    'contact_name',
    'contact_phone',
    'channel',
    'raw_text',
    'summary_title',
    'worry_type',
    'preferred_response_channel',
    'status',
    'ops_status',
    'priority',
    'social_care_requested',
    'created_at'
  ].join(',')

  const result = await rest(
    'care_assisted_intake_requests?select=' +
      encodeURIComponent(select) +
      '&order=created_at.desc&limit=100'
  )

  if (!result.ok) {
    return {
      ok: false,
      items: [] as AnyRow[],
      error: result.error
    }
  }

  return {
    ok: true,
    items: Array.isArray(result.data)
      ? result.data.map((row) => normalizeItem(row, 'care_assisted_intake_requests'))
      : [],
    error: null
  }
}

async function getCareIntakeEntries() {
  const result = await rest('care_intake_entries?select=*&order=created_at.desc&limit=100')

  if (!result.ok) {
    return {
      ok: false,
      items: [] as AnyRow[],
      error: result.error
    }
  }

  return {
    ok: true,
    items: Array.isArray(result.data)
      ? result.data.map((row) => normalizeItem(row, 'care_intake_entries'))
      : [],
    error: null
  }
}

export async function GET() {
  const [assisted, careIntake] = await Promise.all([
    getAssistedIntakeItems(),
    getCareIntakeEntries()
  ])

  const items = [...assisted.items, ...careIntake.items]
    .filter((item) => item.id)
    .sort((a, b) => {
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return bTime - aTime
    })

  const summary = {
    total: items.length,
    open: items.filter((item) => ['received', 'open', 'pending'].includes(item.status)).length,
    urgent: items.filter((item) => item.priority === 'urgent' || item.priority === 'high').length,
    converted: items.filter((item) => ['converted', 'completed', 'done'].includes(item.status)).length,
    assisted_count: assisted.items.length,
    care_intake_count: careIntake.items.length
  }

  return NextResponse.json({
    ok: true,
    items,
    summary,
    sources: {
      care_assisted_intake_requests: {
        ok: assisted.ok,
        error: assisted.ok ? null : assisted.error
      },
      care_intake_entries: {
        ok: careIntake.ok,
        error: careIntake.ok ? null : careIntake.error
      }
    }
  })
}

async function patchWithFallback(input: {
  table: string
  id: string
  status: string
}) {
  const now = new Date().toISOString()

  const fullPayload: Record<string, unknown> = {
    status: input.status,
    ops_status: input.status,
    updated_at: now
  }

  if (input.status === 'processing') {
    fullPayload.processed_at = now
  }

  if (input.status === 'converted') {
    fullPayload.converted_at = now
  }

  const fullPatch = await rest(input.table + '?id=eq.' + encodeURIComponent(input.id), {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation'
    },
    body: JSON.stringify(fullPayload)
  })

  if (fullPatch.ok) {
    return {
      ok: true,
      result: fullPatch,
      usedPayload: 'fullPayload'
    }
  }

  const opsOnlyPayload: Record<string, unknown> = {
    ops_status: input.status
  }

  if (input.status === 'processing') {
    opsOnlyPayload.processed_at = now
  }

  if (input.status === 'converted') {
    opsOnlyPayload.converted_at = now
  }

  const opsOnlyPatch = await rest(input.table + '?id=eq.' + encodeURIComponent(input.id), {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation'
    },
    body: JSON.stringify(opsOnlyPayload)
  })

  if (opsOnlyPatch.ok) {
    return {
      ok: true,
      result: opsOnlyPatch,
      usedPayload: 'opsOnlyPayload'
    }
  }

  const statusOnlyPatch = await rest(input.table + '?id=eq.' + encodeURIComponent(input.id), {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      status: input.status
    })
  })

  if (statusOnlyPatch.ok) {
    return {
      ok: true,
      result: statusOnlyPatch,
      usedPayload: 'statusOnlyPayload'
    }
  }

  return {
    ok: false,
    result: statusOnlyPatch,
    usedPayload: 'failed',
    errors: {
      fullPatch: fullPatch.error,
      opsOnlyPatch: opsOnlyPatch.error,
      statusOnlyPatch: statusOnlyPatch.error
    }
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const id = text(body.id)
  const source = text(body.source)
  const status = text(body.status) || 'processing'

  if (!id) {
    return NextResponse.json(
      {
        ok: false,
        message: 'id가 필요합니다.'
      },
      { status: 400 }
    )
  }

  const table =
    source === 'care_intake_entries'
      ? 'care_intake_entries'
      : 'care_assisted_intake_requests'

  const patched = await patchWithFallback({
    table,
    id,
    status
  })

  if (!patched.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '상태 변경 중 오류가 발생했습니다.',
        detail: patched.errors || patched.result.error,
        table,
        id,
        requestedStatus: status
      },
      { status: 500 }
    )
  }

  const item = Array.isArray(patched.result.data)
    ? patched.result.data[0]
    : patched.result.data

  return NextResponse.json({
    ok: true,
    message: '상태가 변경됐습니다.',
    item,
    usedPayload: patched.usedPayload
  })
}
