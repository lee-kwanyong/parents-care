import { NextResponse } from 'next/server'
import { buildCarePlanTasks, buildDailyCareTasks } from '@/lib/family-task-engine'

export const dynamic = 'force-dynamic'

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

async function fetchRecentDailyCare() {
  const select = [
    'id',
    'elder_name',
    'check_type',
    'care_label',
    'status',
    'memo',
    'occurred_at'
  ].join(',')

  const result = await rest(
    'daily_care_checkins?select=' +
      encodeURIComponent(select) +
      '&order=occurred_at.desc&limit=50'
  )

  if (!result.ok || !Array.isArray(result.data)) return []
  return result.data
}

async function fetchRecentPlanEvents() {
  const select = [
    'id',
    'care_intake_entry_id',
    'event_type',
    'title',
    'description',
    'created_at'
  ].join(',')

  const result = await rest(
    'care_orchestration_events?select=' +
      encodeURIComponent(select) +
      '&event_type=eq.care_plan_created&order=created_at.desc&limit=10'
  )

  if (!result.ok || !Array.isArray(result.data)) return []
  return result.data
}

function parsePlanEvent(event: any) {
  try {
    const plan = JSON.parse(event.description || '{}')
    return {
      intakeId: event.care_intake_entry_id || undefined,
      title: plan.title,
      primaryActions: plan.primaryActions,
      familyQuestions: plan.familyQuestions,
      passportSafetyNotes: plan.passportSafetyNotes,
      socialCareNote: plan.socialCareNote
    }
  } catch {
    return null
  }
}

export async function POST() {
  const dailyCare = await fetchRecentDailyCare()
  const dailyTasks = buildDailyCareTasks(dailyCare)

  const planEvents = await fetchRecentPlanEvents()
  const planTasks = planEvents
    .map(parsePlanEvent)
    .filter(Boolean)
    .flatMap((plan) => buildCarePlanTasks(plan as any))

  const allTasks = [...dailyTasks, ...planTasks]

  if (allTasks.length === 0) {
    return NextResponse.json({
      ok: true,
      inserted: 0,
      message: '자동 생성할 가족 할 일이 없습니다.'
    })
  }

  const insertRows = allTasks.map((task) => ({
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: 'pending',
    source_type: task.source_type,
    source_id: task.source_id,
    dedupe_key: task.dedupe_key,
    created_by_role: 'system',
    memo: task.memo || null
  }))

  const insert = await rest('family_action_items?on_conflict=dedupe_key', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation,resolution=ignore-duplicates'
    },
    body: JSON.stringify(insertRows)
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 할 일 자동 생성 중 오류가 발생했습니다.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    inserted: Array.isArray(insert.data) ? insert.data.length : 0,
    candidates: allTasks.length,
    items: Array.isArray(insert.data) ? insert.data : []
  })
}
