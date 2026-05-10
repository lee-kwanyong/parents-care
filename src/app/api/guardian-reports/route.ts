import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
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
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    data: parsed,
    error: null
  }
}

export async function GET() {
  const [reportsResult, actionsResult] = await Promise.all([
    rest(
      'care_guardian_reports?select=' +
        encodeURIComponent('id,assignment_id,elder_name,guardian_name,guardian_phone,manager_name,report_title,report_status,reassurance_state,summary_30sec,parent_condition,visit_result,medication_result,document_result,meal_result,next_actions,check_events,report_memo,viewed_by_guardian_at,created_at') +
        '&order=created_at.desc&limit=100'
    ),
    rest(
      'care_guardian_report_actions?select=' +
        encodeURIComponent('id,care_report_id,assignment_id,action_title,action_description,action_status,assigned_to_role,sort_order,completed_at,created_at') +
        '&order=sort_order.asc,created_at.asc&limit=500'
    )
  ])

  if (!reportsResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '보호자 리포트를 불러오지 못했습니다.',
        detail: reportsResult.error
      },
      { status: 500 }
    )
  }

  const reports = Array.isArray(reportsResult.data) ? reportsResult.data : []
  const actions = actionsResult.ok && Array.isArray(actionsResult.data) ? actionsResult.data : []

  return NextResponse.json({
    ok: true,
    reports,
    actions,
    summary: {
      total: reports.length,
      ready: reports.filter((item: any) => item.report_status === 'ready').length,
      viewed: reports.filter((item: any) => item.viewed_by_guardian_at).length,
      openActions: actions.filter((item: any) => item.action_status === 'open').length
    }
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const kind = text(body.kind)
  const id = text(body.id)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (kind === 'view_report') {
    const result = await rest('care_guardian_reports?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        viewed_by_guardian_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '리포트 확인 처리 실패', detail: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, item: Array.isArray(result.data) ? result.data[0] : result.data })
  }

  if (kind === 'complete_action') {
    const result = await rest('care_guardian_report_actions?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        action_status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '할 일 완료 처리 실패', detail: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, item: Array.isArray(result.data) ? result.data[0] : result.data })
  }

  return NextResponse.json({ ok: false, message: 'kind가 올바르지 않습니다.' }, { status: 400 })
}
