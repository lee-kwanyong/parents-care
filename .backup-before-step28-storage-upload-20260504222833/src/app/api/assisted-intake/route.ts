import { NextRequest, NextResponse } from 'next/server'
import {
  inferAssistedIntake,
  type AssistedAssetKind,
  type AssistedIntakeChannel,
  type AssistedIntakeStatus
} from '@/lib/assisted-intake-engine'

export const dynamic = 'force-dynamic'

const allowedChannels = new Set(['photo', 'kakao', 'sms', 'phone', 'text', 'document'])
const allowedStatuses = new Set(['received', 'triaged', 'converted', 'needs_more_info', 'closed', 'cancelled'])
const allowedAssetKinds = new Set(['image', 'text', 'document', 'other'])

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

function bool(value: unknown) {
  return value === true || value === 'true' || value === 'on'
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

function mapToCareIntakeChannel(channel: string) {
  if (channel === 'phone') return 'phone'
  if (channel === 'kakao') return 'kakao'
  if (channel === 'photo' || channel === 'document') return 'photo'
  return 'simple_form'
}

export async function GET() {
  const requestSelect = [
    'id',
    'elder_name',
    'contact_name',
    'contact_phone',
    'intake_channel',
    'raw_text',
    'summary_title',
    'auto_detected_worry',
    'recommended_pack_code',
    'status',
    'priority',
    'social_care_requested',
    'preferred_response_channel',
    'converted_care_intake_entry_id',
    'ops_memo',
    'created_at',
    'updated_at'
  ].join(',')

  const assetSelect = [
    'id',
    'assisted_intake_request_id',
    'asset_kind',
    'file_name',
    'mime_type',
    'size_bytes',
    'text_content',
    'data_url',
    'storage_path',
    'created_at'
  ].join(',')

  const parseSelect = [
    'id',
    'assisted_intake_request_id',
    'parse_status',
    'extracted_text',
    'detected_worry',
    'recommended_pack_code',
    'family_questions',
    'ops_next_actions',
    'confidence_label',
    'created_at'
  ].join(',')

  const [requests, assets, parses] = await Promise.all([
    rest('care_assisted_intake_requests?select=' + encodeURIComponent(requestSelect) + '&order=created_at.desc&limit=100'),
    rest('care_assisted_intake_assets?select=' + encodeURIComponent(assetSelect) + '&order=created_at.desc&limit=500'),
    rest('care_assisted_intake_parse_results?select=' + encodeURIComponent(parseSelect) + '&order=created_at.desc&limit=200')
  ])

  if (!requests.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '간편 접수 목록을 불러오지 못했습니다. STEP22 SQL이 실행됐는지 확인해주세요.',
        detail: requests.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    requests: Array.isArray(requests.data) ? requests.data : [],
    assets: assets.ok && Array.isArray(assets.data) ? assets.data : [],
    parses: parses.ok && Array.isArray(parses.data) ? parses.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'create_request'

  if (action === 'create_request') {
    const elderName = text(body.elderName) || '부모님'
    const contactName = text(body.contactName)
    const contactPhone = text(body.contactPhone)
    const rawText = text(body.rawText)
    const channelValue = text(body.channel) || 'photo'
    const socialCareRequested = bool(body.socialCareRequested)

    if (!allowedChannels.has(channelValue)) {
      return NextResponse.json({ ok: false, message: 'channel이 올바르지 않습니다.' }, { status: 400 })
    }

    const channel = channelValue as AssistedIntakeChannel
    const assetsInput = Array.isArray(body.assets) ? body.assets : []
    const fileNames = assetsInput.map((asset: any) => text(asset.fileName)).filter(Boolean)

    const inferred = inferAssistedIntake({
      rawText,
      channel,
      fileNames,
      socialCareRequested
    })

    const insert = await rest('care_assisted_intake_requests', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          elder_name: elderName,
          contact_name: contactName || null,
          contact_phone: contactPhone || null,
          intake_channel: channel,
          raw_text: rawText || null,
          summary_title: inferred.summaryTitle,
          auto_detected_worry: inferred.worry,
          recommended_pack_code: inferred.packCode,
          status: 'received',
          priority: inferred.priority,
          social_care_requested: socialCareRequested,
          preferred_response_channel: channel === 'kakao' ? 'kakao' : 'phone',
          created_by_role: 'family'
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '간편 접수 저장 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    const saved = Array.isArray(insert.data) ? insert.data[0] : null

    if (!saved?.id) {
      return NextResponse.json({ ok: false, message: '저장된 접수 정보를 찾지 못했습니다.' }, { status: 500 })
    }

    const assetRows = assetsInput.slice(0, 8).map((asset: any) => {
      const kindValue = text(asset.assetKind) || 'other'
      const assetKind: AssistedAssetKind = allowedAssetKinds.has(kindValue) ? (kindValue as AssistedAssetKind) : 'other'

      return {
        assisted_intake_request_id: saved.id,
        asset_kind: assetKind,
        file_name: text(asset.fileName) || null,
        mime_type: text(asset.mimeType) || null,
        size_bytes: typeof asset.sizeBytes === 'number' ? asset.sizeBytes : null,
        text_content: text(asset.textContent) || null,
        data_url: text(asset.dataUrl) || null,
        storage_path: null
      }
    })

    if (assetRows.length > 0) {
      await rest('care_assisted_intake_assets', {
        method: 'POST',
        body: JSON.stringify(assetRows)
      })
    }

    await rest('care_assisted_intake_parse_results', {
      method: 'POST',
      body: JSON.stringify([
        {
          assisted_intake_request_id: saved.id,
          parse_status: 'auto_detected',
          extracted_text: rawText || fileNames.join(' / ') || null,
          detected_worry: inferred.worry,
          recommended_pack_code: inferred.packCode,
          family_questions: inferred.familyQuestions,
          ops_next_actions: inferred.opsNextActions,
          confidence_label: inferred.confidence
        }
      ])
    })

    await rest('family_action_items?on_conflict=dedupe_key', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
      body: JSON.stringify([
        {
          title: `${elderName} 사진·카톡 간편 접수 확인하기`,
          description: '운영실이 사진, 카톡, 문자 내용을 확인해 케어 요청으로 정리합니다.',
          category: inferred.worry === 'documents' ? 'documents' : inferred.worry === 'meal' ? 'meal' : 'care_plan',
          priority: inferred.priority,
          status: 'pending',
          source_type: 'manual',
          source_id: null,
          dedupe_key: `assisted-intake:${saved.id}:family-check`,
          created_by_role: 'system',
          memo: rawText || null
        }
      ])
    })

    return NextResponse.json({
      ok: true,
      request: saved,
      inferred
    })
  }

  if (action === 'convert_to_care_request') {
    const id = text(body.id)

    if (!id) {
      return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
    }

    const select = [
      'id',
      'elder_name',
      'contact_name',
      'contact_phone',
      'intake_channel',
      'raw_text',
      'summary_title',
      'auto_detected_worry',
      'recommended_pack_code',
      'priority',
      'social_care_requested',
      'preferred_response_channel',
      'status'
    ].join(',')

    const found = await rest(
      'care_assisted_intake_requests?select=' + encodeURIComponent(select) + '&id=eq.' + encodeURIComponent(id) + '&limit=1'
    )

    if (!found.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '간편 접수 정보를 불러오지 못했습니다.',
          detail: found.error
        },
        { status: 500 }
      )
    }

    const item = Array.isArray(found.data) ? found.data[0] : null

    if (!item) {
      return NextResponse.json({ ok: false, message: '간편 접수를 찾지 못했습니다.' }, { status: 404 })
    }

    const careInsert = await rest('care_intake_entries', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          intake_channel: mapToCareIntakeChannel(item.intake_channel),
          raw_text: item.raw_text || item.summary_title,
          resolved_worry: item.auto_detected_worry,
          recommended_pack_code: item.recommended_pack_code,
          ai_summary: `${item.summary_title} / 사진·카톡·문자 간편 접수에서 변환`,
          ops_status: 'new',
          social_care_requested: item.social_care_requested,
          contact_name: item.contact_name,
          contact_phone: item.contact_phone,
          preferred_response_channel: item.preferred_response_channel,
          easy_mode_used: true
        }
      ])
    })

    if (!careInsert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '케어 요청으로 변환 중 오류가 발생했습니다. care_intake_entries 테이블을 확인해주세요.',
          detail: careInsert.error
        },
        { status: 500 }
      )
    }

    const careEntry = Array.isArray(careInsert.data) ? careInsert.data[0] : null

    await rest('care_assisted_intake_requests?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        status: 'converted',
        converted_care_intake_entry_id: careEntry?.id || null,
        updated_at: new Date().toISOString()
      })
    })

    if (careEntry?.id) {
      await rest('care_orchestration_events', {
        method: 'POST',
        body: JSON.stringify([
          {
            care_intake_entry_id: careEntry.id,
            event_type: 'assisted_intake_converted',
            title: '사진·카톡 간편 접수에서 케어 요청 생성',
            description: item.summary_title,
            actor_role: 'ops',
            severity: item.priority === 'urgent' ? 'urgent' : 'info'
          }
        ])
      })
    }

    return NextResponse.json({
      ok: true,
      careEntry
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
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

  const status = statusValue as AssistedIntakeStatus

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  }

  if (opsMemo) patch.ops_memo = opsMemo

  const result = await rest('care_assisted_intake_requests?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '간편 접수 상태 변경 실패',
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
