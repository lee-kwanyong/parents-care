import { NextRequest, NextResponse } from 'next/server'
import { buildDefaultDischargeChecks, type DischargeCheckStatus, type DischargePackStatus } from '@/lib/discharge-care-engine'

export const dynamic = 'force-dynamic'

const allowedPackStatuses = new Set(['active', 'paused', 'completed', 'cancelled'])
const allowedCheckStatuses = new Set(['planned', 'done', 'needs_attention', 'skipped', 'overdue'])

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

export async function GET() {
  const packSelect = [
    'id',
    'elder_name',
    'guardian_name',
    'guardian_phone',
    'hospital_name',
    'discharge_date',
    'next_visit_date',
    'primary_diagnosis',
    'medication_risk',
    'meal_risk',
    'mobility_risk',
    'fall_risk',
    'status',
    'memo',
    'ops_memo',
    'completed_at',
    'created_at',
    'updated_at'
  ].join(',')

  const checkSelect = [
    'id',
    'care_pack_id',
    'day_index',
    'check_date',
    'title',
    'check_focus',
    'status',
    'medication_status',
    'meal_status',
    'condition_status',
    'pain_level',
    'family_note',
    'ops_note',
    'completed_at',
    'created_at',
    'updated_at'
  ].join(',')

  const [packs, checks] = await Promise.all([
    rest('post_discharge_care_packs?select=' + encodeURIComponent(packSelect) + '&order=created_at.desc&limit=50'),
    rest('post_discharge_daily_checks?select=' + encodeURIComponent(checkSelect) + '&order=check_date.asc,day_index.asc&limit=350')
  ])

  if (!packs.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '퇴원 후 안심팩 목록을 불러오지 못했습니다. STEP17 SQL이 실행됐는지 확인해주세요.',
        detail: packs.error
      },
      { status: 500 }
    )
  }

  if (!checks.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '퇴원 후 7일 체크 목록을 불러오지 못했습니다. STEP17 SQL이 실행됐는지 확인해주세요.',
        detail: checks.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    packs: Array.isArray(packs.data) ? packs.data : [],
    checks: Array.isArray(checks.data) ? checks.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const elderName = text(body.elderName) || '부모님'
  const guardianName = text(body.guardianName)
  const guardianPhone = text(body.guardianPhone)
  const hospitalName = text(body.hospitalName)
  const dischargeDate = text(body.dischargeDate)
  const nextVisitDate = text(body.nextVisitDate)
  const primaryDiagnosis = text(body.primaryDiagnosis)
  const memo = text(body.memo)

  if (!dischargeDate) {
    return NextResponse.json({ ok: false, message: '퇴원일이 필요합니다.' }, { status: 400 })
  }

  const packInsert = await rest('post_discharge_care_packs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: elderName,
        guardian_name: guardianName || null,
        guardian_phone: guardianPhone || null,
        hospital_name: hospitalName || null,
        discharge_date: dischargeDate,
        next_visit_date: nextVisitDate || null,
        primary_diagnosis: primaryDiagnosis || null,
        medication_risk: bool(body.medicationRisk),
        meal_risk: bool(body.mealRisk),
        mobility_risk: bool(body.mobilityRisk),
        fall_risk: bool(body.fallRisk),
        status: 'active',
        memo: memo || null,
        created_by_role: 'family'
      }
    ])
  })

  if (!packInsert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '퇴원 후 안심팩 저장 중 오류가 발생했습니다.',
        detail: packInsert.error
      },
      { status: 500 }
    )
  }

  const pack = Array.isArray(packInsert.data) ? packInsert.data[0] : null

  if (!pack?.id) {
    return NextResponse.json({ ok: false, message: '저장된 안심팩 정보를 찾지 못했습니다.' }, { status: 500 })
  }

  const checkRows = buildDefaultDischargeChecks(dischargeDate).map((check) => ({
    ...check,
    care_pack_id: pack.id
  }))

  const checkInsert = await rest('post_discharge_daily_checks', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(checkRows)
  })

  if (!checkInsert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '퇴원 후 7일 체크 생성 중 오류가 발생했습니다.',
        detail: checkInsert.error
      },
      { status: 500 }
    )
  }

  await rest('family_action_items?on_conflict=dedupe_key', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
    body: JSON.stringify([
      {
        title: `${elderName} 퇴원 후 7일 안심팩 확인하기`,
        description: '약, 식사, 통증, 컨디션, 다음 외래, 낙상 위험을 7일 동안 확인합니다.',
        category: 'condition',
        priority: bool(body.fallRisk) || bool(body.medicationRisk) ? 'high' : 'normal',
        status: 'pending',
        source_type: 'care_plan',
        source_id: pack.id,
        dedupe_key: `discharge-pack:${pack.id}:start`,
        created_by_role: 'system',
        memo: memo || null
      }
    ])
  })

  return NextResponse.json({
    ok: true,
    pack,
    checks: Array.isArray(checkInsert.data) ? checkInsert.data : []
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const kind = text(body.kind)
  const id = text(body.id)
  const statusValue = text(body.status)
  const opsNote = text(body.opsNote)
  const familyNote = text(body.familyNote)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (kind === 'pack') {
    if (!allowedPackStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'pack status가 올바르지 않습니다.' }, { status: 400 })
    }

    const status = statusValue as DischargePackStatus

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (opsNote) patch.ops_memo = opsNote
    if (status === 'completed') patch.completed_at = new Date().toISOString()

    const result = await rest('post_discharge_care_packs?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '안심팩 상태 변경 실패', detail: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, item: Array.isArray(result.data) ? result.data[0] : result.data })
  }

  if (kind === 'check') {
    if (!allowedCheckStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'check status가 올바르지 않습니다.' }, { status: 400 })
    }

    const status = statusValue as DischargeCheckStatus

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (familyNote) patch.family_note = familyNote
    if (opsNote) patch.ops_note = opsNote
    if (status === 'done') {
      patch.completed_at = new Date().toISOString()
      patch.condition_status = 'good'
      patch.medication_status = 'done'
      patch.meal_status = 'done'
    }

    if (status === 'needs_attention') {
      patch.condition_status = 'needs_help'
    }

    const result = await rest('post_discharge_daily_checks?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '퇴원 후 체크 상태 변경 실패', detail: result.error }, { status: 500 })
    }

    const updated = Array.isArray(result.data) ? result.data[0] : result.data

    if (status === 'needs_attention' && updated?.care_pack_id) {
      await rest('family_action_items?on_conflict=dedupe_key', {
        method: 'POST',
        headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
        body: JSON.stringify([
          {
            title: `${updated.title || '퇴원 후 체크'} 주의 항목 확인하기`,
            description: updated.check_focus || '퇴원 후 7일 안심팩에서 주의가 필요한 항목입니다.',
            category: 'condition',
            priority: 'high',
            status: 'pending',
            source_type: 'care_plan',
            source_id: updated.id,
            dedupe_key: `discharge-check:${updated.id}:attention`,
            created_by_role: 'system',
            memo: updated.family_note || null
          }
        ])
      })
    }

    return NextResponse.json({ ok: true, item: updated })
  }

  return NextResponse.json({ ok: false, message: 'kind는 pack 또는 check여야 합니다.' }, { status: 400 })
}
