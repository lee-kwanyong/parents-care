import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: unknown) {
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

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null as unknown,
      error: 'Supabase env is missing'
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
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const graph = body.graph || {}

  const familyCode = text(graph.familyCode || body.familyCode)

  if (!familyCode) {
    return NextResponse.json(
      { ok: false, message: 'familyCode가 필요합니다.' },
      { status: 400 }
    )
  }

  const payload = {
    family_code: familyCode,
    snapshot_type: text(body.snapshotType) || 'manual',
    graph_status: text(graph.graphStatus),
    risk_score: number(graph.riskScore),
    burden_score: number(graph.burdenScore),
    closure_score: number(graph.closureScore),
    payload: graph,
    created_by: text(body.createdBy) || '운영실'
  }

  const result = await rest('anbu_graph_snapshots', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: 'AnbuGraph 스냅샷 저장에 실패했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: 'AnbuGraph 스냅샷이 저장되었습니다.',
    snapshot: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
