import { NextRequest, NextResponse } from 'next/server'
import {
  inferSocialPriority,
  makeVoucherCode,
  normalizeNeedTypes,
  recommendSocialPrograms,
  type LivingSituation,
  type SocialCaseStatus,
  type SocialUrgency
} from '@/lib/social-care-engine'

export const dynamic = 'force-dynamic'

const allowedUrgencies = new Set(['low', 'normal', 'high', 'urgent'])
const allowedLivingSituations = new Set(['alone', 'with_spouse', 'with_family', 'facility', 'unknown'])
const allowedStatuses = new Set(['requested', 'reviewing', 'eligible', 'voucher_issued', 'connected', 'not_eligible', 'closed', 'cancelled'])
const allowedVoucherStatuses = new Set(['issued', 'reserved', 'used', 'expired', 'cancelled'])

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

export async function GET() {
  const caseSelect = [
    'id',
    'elder_name',
    'guardian_name',
    'guardian_phone',
    'need_types',
    'urgency',
    'living_situation',
    'cost_burden',
    'meal_risk',
    'medication_risk',
    'post_discharge_risk',
    'no_family_nearby',
    'preferred_contact',
    'recommended_program_codes',
    'status',
    'priority',
    'memo',
    'ops_memo',
    'reviewed_at',
    'connected_at',
    'closed_at',
    'created_at',
    'updated_at'
  ].join(',')

  const programSelect = [
    'id',
    'program_code',
    'title',
    'description',
    'support_type',
    'target_need_types',
    'is_active',
    'requires_ops_review',
    'contact_method',
    'memo',
    'created_at',
    'updated_at'
  ].join(',')

  const voucherSelect = [
    'id',
    'social_support_case_id',
    'elder_name',
    'voucher_code',
    'voucher_type',
    'title',
    'description',
    'value_label',
    'sponsor_name',
    'status',
    'issued_at',
    'used_at',
    'expires_at',
    'memo',
    'created_at',
    'updated_at'
  ].join(',')

  const [cases, programs, vouchers] = await Promise.all([
    rest('parent_care_social_support_cases?select=' + encodeURIComponent(caseSelect) + '&order=created_at.desc&limit=100'),
    rest('parent_care_social_support_programs?select=' + encodeURIComponent(programSelect) + '&is_active=eq.true&order=created_at.asc&limit=100'),
    rest('parent_care_support_vouchers?select=' + encodeURIComponent(voucherSelect) + '&order=created_at.desc&limit=100')
  ])

  if (!cases.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '사회공헌 요청 목록을 불러오지 못했습니다. STEP19 SQL이 실행됐는지 확인해주세요.',
        detail: cases.error
      },
      { status: 500 }
    )
  }

  if (!programs.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '사회공헌 프로그램 목록을 불러오지 못했습니다. STEP19 SQL이 실행됐는지 확인해주세요.',
        detail: programs.error
      },
      { status: 500 }
    )
  }

  if (!vouchers.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '후원 쿠폰 목록을 불러오지 못했습니다. STEP19 SQL이 실행됐는지 확인해주세요.',
        detail: vouchers.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    cases: Array.isArray(cases.data) ? cases.data : [],
    programs: Array.isArray(programs.data) ? programs.data : [],
    vouchers: Array.isArray(vouchers.data) ? vouchers.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const elderName = text(body.elderName) || '부모님'
  const guardianName = text(body.guardianName)
  const guardianPhone = text(body.guardianPhone)

  const needTypes = normalizeNeedTypes(body.needTypes)
  const urgencyValue = text(body.urgency) || 'normal'
  const livingValue = text(body.livingSituation) || 'unknown'

  const urgency: SocialUrgency = allowedUrgencies.has(urgencyValue) ? (urgencyValue as SocialUrgency) : 'normal'
  const livingSituation: LivingSituation = allowedLivingSituations.has(livingValue) ? (livingValue as LivingSituation) : 'unknown'

  const costBurden = bool(body.costBurden) || needTypes.includes('cost_burden')
  const mealRisk = bool(body.mealRisk) || needTypes.includes('meal')
  const medicationRisk = bool(body.medicationRisk) || needTypes.includes('medication')
  const postDischargeRisk = bool(body.postDischargeRisk) || needTypes.includes('post_discharge')
  const noFamilyNearby = bool(body.noFamilyNearby) || needTypes.includes('no_family_nearby') || livingSituation === 'alone'

  const preferredContact = text(body.preferredContact) || 'phone'
  const memo = text(body.memo)

  const recommendedProgramCodes = recommendSocialPrograms({
    needTypes,
    costBurden,
    mealRisk,
    postDischargeRisk,
    noFamilyNearby,
    livingSituation
  })

  const priority = inferSocialPriority({
    urgency,
    needTypes,
    costBurden,
    mealRisk,
    medicationRisk,
    postDischargeRisk,
    noFamilyNearby
  })

  const insert = await rest('parent_care_social_support_cases', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: elderName,
        guardian_name: guardianName || null,
        guardian_phone: guardianPhone || null,
        need_types: needTypes,
        urgency,
        living_situation: livingSituation,
        cost_burden: costBurden,
        meal_risk: mealRisk,
        medication_risk: medicationRisk,
        post_discharge_risk: postDischargeRisk,
        no_family_nearby: noFamilyNearby,
        preferred_contact: ['phone', 'kakao', 'app', 'ops'].includes(preferredContact) ? preferredContact : 'phone',
        recommended_program_codes: recommendedProgramCodes,
        status: 'requested',
        priority,
        memo: memo || null,
        created_by_role: 'family'
      }
    ])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '사회공헌 요청 저장 중 오류가 발생했습니다.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  const saved = Array.isArray(insert.data) ? insert.data[0] : null

  if (saved?.id) {
    await rest('family_action_items?on_conflict=dedupe_key', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
      body: JSON.stringify([
        {
          title: `${elderName} 사회공헌 지원 가능성 확인하기`,
          description: '비용 부담, 식사 지원, 공공지원, 후원 쿠폰 연결 가능성을 운영실이 검토합니다.',
          category: 'social_support',
          priority,
          status: 'pending',
          source_type: 'manual',
          source_id: null,
          dedupe_key: `social-support:${saved.id}:review`,
          created_by_role: 'system',
          memo: memo || null
        }
      ])
    })
  }

  return NextResponse.json({
    ok: true,
    case: saved,
    recommendedProgramCodes
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const kind = text(body.kind) || 'case'
  const id = text(body.id)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (kind === 'case') {
    const statusValue = text(body.status)

    if (!allowedStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
    }

    const status = statusValue as SocialCaseStatus
    const opsMemo = text(body.opsMemo)

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (opsMemo) patch.ops_memo = opsMemo
    if (status === 'reviewing') patch.reviewed_at = new Date().toISOString()
    if (status === 'connected') patch.connected_at = new Date().toISOString()
    if (status === 'closed' || status === 'not_eligible') patch.closed_at = new Date().toISOString()

    const result = await rest('parent_care_social_support_cases?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '사회공헌 요청 상태 변경 실패',
          detail: result.error
        },
        { status: 500 }
      )
    }

    const updated = Array.isArray(result.data) ? result.data[0] : result.data

    if (status === 'voucher_issued' && updated?.id) {
      await rest('parent_care_support_vouchers', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify([
          {
            social_support_case_id: updated.id,
            elder_name: updated.elder_name || '부모님',
            voucher_code: makeVoucherCode(),
            voucher_type: updated.meal_risk ? 'meal_support' : updated.post_discharge_risk ? 'post_discharge' : 'care_discount',
            title: '후원형 케어 쿠폰',
            description: '운영실 검토 후 사용할 수 있는 후원형 케어 지원입니다.',
            value_label: updated.meal_risk ? '식사 지원 검토' : '케어 비용 지원 검토',
            sponsor_name: '부모님 케어 사회공헌',
            status: 'issued',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            memo: opsMemo || null
          }
        ])
      })
    }

    return NextResponse.json({ ok: true, item: updated })
  }

  if (kind === 'voucher') {
    const status = text(body.status)

    if (!allowedVoucherStatuses.has(status)) {
      return NextResponse.json({ ok: false, message: 'voucher status가 올바르지 않습니다.' }, { status: 400 })
    }

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'used') patch.used_at = new Date().toISOString()

    const result = await rest('parent_care_support_vouchers?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '후원 쿠폰 상태 변경 실패',
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

  return NextResponse.json({ ok: false, message: 'kind는 case 또는 voucher여야 합니다.' }, { status: 400 })
}
