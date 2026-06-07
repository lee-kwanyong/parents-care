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

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
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

function latestByType(rows: Row[]) {
  const map: Record<string, Row> = {}

  for (const row of rows) {
    const type = text(row.record_type)
    if (!type) continue
    if (!map[type]) map[type] = row
  }

  return map
}

async function insertAudit(input: {
  actorName: string
  actionType: string
  targetType: string
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
        description: input.description,
        metadata: input.metadata || {}
      }
    ])
  })
}

export async function GET() {
  const result = await rest('gov_compliance_records?select=*&order=created_at.desc&limit=200')

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '컴플라이언스 기록을 불러오지 못했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  const rows = Array.isArray(result.data) ? result.data as Row[] : []

  return NextResponse.json({
    ok: true,
    records: rows,
    latest: latestByType(rows)
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const recordType = text(body.recordType || body.record_type)
  const title = text(body.title)

  if (!recordType || !title) {
    return NextResponse.json(
      {
        ok: false,
        message: '기록 유형과 제목이 필요합니다.'
      },
      { status: 400 }
    )
  }

  const payload = {
    record_type: recordType,
    status: text(body.status) || 'done',
    title,
    content: text(body.content),
    evidence_count: Number(body.evidenceCount || body.evidence_count || 0),
    checked_by_name: text(body.checkedByName || body.checked_by_name) || '운영실',
    target_route: text(body.targetRoute || body.target_route),
    payload: body,
    updated_at: new Date().toISOString()
  }

  const result = await rest('gov_compliance_records', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '컴플라이언스 기록을 저장하지 못했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  await insertAudit({
    actorName: payload.checked_by_name,
    actionType: 'create',
    targetType: 'gov_compliance_record',
    description: `공공 제출 컴플라이언스 기록: ${payload.title}`,
    metadata: payload
  })

  return NextResponse.json({
    ok: true,
    message: '컴플라이언스 기록이 저장되었습니다.',
    record: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
