import { NextRequest, NextResponse } from 'next/server'
import { buildSimpleCarePlan, parsePlanFromDescription, type CarePassportForPlan } from '@/lib/care-plan-engine'

export const dynamic = 'force-dynamic'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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

async function fetchLatestPassport(): Promise<CarePassportForPlan | null> {
  const select = [
    'id',
    'elder_name',
    'hearing_attention',
    'mobility_attention',
    'allergy_status',
    'has_medications',
    'fall_risk_level',
    'body_conditions',
    'allergies',
    'medications',
    'diet_needs',
    'communication_notes',
    'emergency_notes',
    'care_summary'
  ].join(',')

  const result = await rest(
    'parent_care_passports?select=' + encodeURIComponent(select) + '&order=updated_at.desc&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data)) return null
  return result.data[0] || null
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || ''

  if (!id) {
    return NextResponse.json({ ok: false, message: '접수번호가 필요합니다.' }, { status: 400 })
  }

  const select = [
    'id',
    'resolved_worry',
    'recommended_pack_code',
    'raw_text',
    'ai_summary',
    'ops_status',
    'contact_name',
    'contact_phone',
    'social_care_requested',
    'created_at',
    'updated_at'
  ].join(',')

  const intakeResult = await rest(
    'care_intake_entries?select=' + encodeURIComponent(select) + '&id=eq.' + encodeURIComponent(id) + '&limit=1'
  )

  if (!intakeResult.ok) {
    return NextResponse.json({ ok: false, message: '접수 정보를 불러오지 못했습니다.', detail: intakeResult.error }, { status: 500 })
  }

  const intake = Array.isArray(intakeResult.data) ? intakeResult.data[0] : null

  if (!intake) {
    return NextResponse.json({ ok: false, message: '접수 정보를 찾을 수 없습니다.' }, { status: 404 })
  }

  const eventsResult = await rest(
    'care_orchestration_events?select=' +
      encodeURIComponent('id,event_type,title,description,actor_role,severity,created_at') +
      '&care_intake_entry_id=eq.' +
      encodeURIComponent(id) +
      '&order=created_at.asc'
  )

  const events = eventsResult.ok && Array.isArray(eventsResult.data) ? eventsResult.data : []
  const planEvent = [...events].reverse().find((event) => event.event_type === 'care_plan_created')
  const savedPlan = parsePlanFromDescription(planEvent?.description)
  const passport = await fetchLatestPassport()

  const fallbackPlan = buildSimpleCarePlan({
    intakeId: id,
    worry: intake.resolved_worry,
    packCode: intake.recommended_pack_code,
    memo: intake.raw_text,
    socialCareRequested: intake.social_care_requested,
    carePassport: passport
  })

  return NextResponse.json({
    ok: true,
    intake,
    plan: savedPlan || fallbackPlan,
    planReady: Boolean(savedPlan) || intake.ops_status === 'plan_created',
    events,
    passportApplied: Boolean((savedPlan || fallbackPlan).passportApplied)
  })
}
