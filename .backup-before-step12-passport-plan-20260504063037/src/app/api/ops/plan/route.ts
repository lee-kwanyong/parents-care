import { NextRequest, NextResponse } from 'next/server'
import { buildSimpleCarePlan } from '@/lib/care-plan-engine'

export const dynamic = 'force-dynamic'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function canUseOpsRoute(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return true
  const secret = process.env.CRON_SECRET || ''
  const given = request.headers.get('x-ops-dev-secret') || ''
  return Boolean(secret && given && secret === given)
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase service env is missing' }
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
  if (!canUseOpsRoute(request)) {
    return NextResponse.json({ ok: false, message: 'ops route locked in production' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const intakeId = typeof body.intakeId === 'string' ? body.intakeId : ''

  if (!intakeId) {
    return NextResponse.json({ ok: false, message: 'intakeId가 필요합니다.' }, { status: 400 })
  }

  const select = [
    'id',
    'family_id',
    'elder_id',
    'resolved_worry',
    'recommended_pack_code',
    'raw_text',
    'social_care_requested',
    'contact_name',
    'contact_phone',
    'ops_status',
    'created_at'
  ].join(',')

  const intakeResult = await rest(
    'care_intake_entries?select=' + encodeURIComponent(select) + '&id=eq.' + encodeURIComponent(intakeId) + '&limit=1'
  )

  if (!intakeResult.ok) {
    return NextResponse.json({ ok: false, message: '접수 정보를 불러오지 못했습니다.', detail: intakeResult.error }, { status: 500 })
  }

  const intake = Array.isArray(intakeResult.data) ? intakeResult.data[0] : null

  if (!intake) {
    return NextResponse.json({ ok: false, message: '접수 정보를 찾을 수 없습니다.' }, { status: 404 })
  }

  const plan = buildSimpleCarePlan({
    intakeId,
    worry: intake.resolved_worry,
    packCode: intake.recommended_pack_code,
    memo: intake.raw_text,
    socialCareRequested: intake.social_care_requested
  })

  const eventInsert = await rest('care_orchestration_events', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_id: intake.family_id,
        elder_id: intake.elder_id,
        care_intake_entry_id: intakeId,
        event_type: 'care_plan_created',
        title: '간편 케어 플랜 생성',
        description: JSON.stringify(plan),
        actor_role: 'ops',
        severity: plan.reassuranceState === '긴급' ? 'urgent' : plan.reassuranceState === '확인 필요' ? 'attention' : 'info'
      },
      {
        family_id: intake.family_id,
        elder_id: intake.elder_id,
        care_intake_entry_id: intakeId,
        event_type: 'family_next_actions_created',
        title: '가족 할 일 3개 생성',
        description: plan.primaryActions.join('\n'),
        actor_role: 'system',
        severity: 'info'
      }
    ])
  })

  if (!eventInsert.ok) {
    return NextResponse.json({ ok: false, message: '케어플랜 이벤트 저장 실패', detail: eventInsert.error }, { status: 500 })
  }

  await rest('care_intake_entries?id=eq.' + encodeURIComponent(intakeId), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ops_status: 'plan_created', updated_at: new Date().toISOString() })
  })

  await rest('notification_outbox', {
    method: 'POST',
    body: JSON.stringify([
      {
        family_id: intake.family_id,
        elder_id: intake.elder_id,
        channel: 'app',
        template_code: 'simple_care_plan_ready',
        title: '부모님 케어플랜이 준비됐습니다',
        body: plan.oneMinuteSummary,
        payload: {
          intake_id: intakeId,
          plan_title: plan.title,
          primary_actions: plan.primaryActions,
          login_deferred: true
        },
        status: 'queued'
      }
    ])
  })

  return NextResponse.json({ ok: true, plan })
}
