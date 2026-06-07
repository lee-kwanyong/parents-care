import { NextResponse } from 'next/server'
import { buildDocumentSummary, type CareDocumentRequest } from '@/lib/document-care-engine'

export const dynamic = 'force-dynamic'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function rest(path: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase env is missing' }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
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
    'elder_name',
    'guardian_name',
    'guardian_phone',
    'document_type',
    'document_label',
    'reason',
    'status',
    'priority',
    'hospital_name',
    'visit_date',
    'memo',
    'ops_memo',
    'collected_at',
    'sent_to_family_at',
    'created_at',
    'updated_at'
  ].join(',')

  const result = await rest(
    'care_document_requests?select=' +
      encodeURIComponent(select) +
      '&order=created_at.desc&limit=100'
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '서류 요청 목록을 불러오지 못했습니다. STEP15 SQL이 실행됐는지 확인해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  const items = Array.isArray(result.data) ? (result.data as CareDocumentRequest[]) : []

  return NextResponse.json({
    ok: true,
    items,
    summary: buildDocumentSummary(items)
  })
}
