import { NextRequest, NextResponse } from 'next/server'
import {
  labelDocumentType,
  normalizeDocumentTypes,
  type DocumentReason,
  type DocumentStatus
} from '@/lib/document-care-engine'

export const dynamic = 'force-dynamic'

const allowedReasons = new Set(['insurance', 'family_record', 'next_hospital', 'company', 'unknown'])
const allowedStatuses = new Set(['requested', 'preparing', 'ready', 'collected', 'sent_to_family', 'not_needed', 'failed'])

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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const elderName = text(body.elderName) || '부모님'
  const guardianName = text(body.guardianName)
  const guardianPhone = text(body.guardianPhone)
  const hospitalName = text(body.hospitalName)
  const visitDate = text(body.visitDate)
  const memo = text(body.memo)
  const reasonValue = text(body.reason) || 'insurance'
  const reason: DocumentReason = allowedReasons.has(reasonValue) ? (reasonValue as DocumentReason) : 'insurance'

  const documentTypes = normalizeDocumentTypes(body.documentTypes)

  const rows = documentTypes.map((documentType) => ({
    elder_name: elderName,
    guardian_name: guardianName || null,
    guardian_phone: guardianPhone || null,
    document_type: documentType,
    document_label: labelDocumentType(documentType),
    reason,
    status: 'requested',
    priority: reason === 'insurance' ? 'high' : 'normal',
    requested_by_role: 'family',
    hospital_name: hospitalName || null,
    visit_date: visitDate || null,
    memo: memo || null
  }))

  const insert = await rest('care_document_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(rows)
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '서류 요청 저장 중 오류가 발생했습니다. STEP15 SQL이 실행됐는지 확인해주세요.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  const saved = Array.isArray(insert.data) ? insert.data : []

  if (saved.length > 0) {
    const taskRows = saved.map((doc: any) => ({
      title: `${doc.document_label} 챙기기`,
      description: `${elderName} ${doc.document_label} 요청이 생성됐습니다. 병원 방문 후 수령 여부를 확인하세요.`,
      category: 'documents',
      priority: doc.priority || 'high',
      status: 'pending',
      source_type: 'document_request',
      source_id: doc.id,
      dedupe_key: `document:${doc.id}`,
      created_by_role: 'system',
      memo: doc.memo || null
    }))

    await rest('family_action_items?on_conflict=dedupe_key', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation,resolution=ignore-duplicates'
      },
      body: JSON.stringify(taskRows)
    })
  }

  return NextResponse.json({
    ok: true,
    items: saved
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const id = text(body.id)
  const statusValue = text(body.status)
  const opsMemo = text(body.opsMemo)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (!allowedStatuses.has(statusValue)) {
    return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
  }

  const status = statusValue as DocumentStatus

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  }

  if (opsMemo) patch.ops_memo = opsMemo
  if (status === 'collected') patch.collected_at = new Date().toISOString()
  if (status === 'sent_to_family') patch.sent_to_family_at = new Date().toISOString()

  const result = await rest('care_document_requests?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '서류 상태 변경 중 오류가 발생했습니다.',
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
