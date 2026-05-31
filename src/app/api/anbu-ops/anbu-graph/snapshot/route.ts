import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

  const graph = body.graph || null
  const summary = body.summary || null

  const result = await rest('anbu_graph_snapshots', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        snapshot_type: 'ops-anbu-graph',
        graph_summary: summary || {},
        graph_payload: graph || {},
        created_by: 'ops'
      }
    ])
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
