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

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
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

function firstRow(result: { data: any }) {
  return Array.isArray(result.data) ? result.data[0] : result.data
}

async function getAssignment(id: string) {
  if (!id) return null

  const result = await rest(
    'manager_field_assignments?select=*&id=eq.' +
      encodeURIComponent(id) +
      '&limit=1'
  )

  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const assignmentId = text(body.assignmentId)
  const reportId = text(body.reportId)
  const assignment = await getAssignment(assignmentId)

  const rating = Math.max(1, Math.min(5, Number(body.rating || 5)))
  const tags = Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : []
  const comment = text(body.comment)

  const insert = await rest('care_partner_reviews', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        assignment_id: assignmentId || null,
        care_report_id: reportId || null,
        manager_profile_id: assignment?.manager_profile_id || null,
        manager_name: text(body.managerName) || assignment?.manager_name || null,
        elder_name: text(body.elderName) || assignment?.elder_name || null,
        guardian_name: text(body.guardianName) || null,
        rating,
        review_tags: tags,
        review_comment: comment || null,
        review_status: 'published'
      }
    ])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '평가 저장 중 오류가 발생했습니다. Supabase에서 supabase/care_partner_reviews.sql을 먼저 실행해주세요.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '평가가 저장됐습니다.',
    review: firstRow(insert)
  })
}
