import { NextRequest, NextResponse } from 'next/server'
import {
  calculateNextDueDate,
  inferRoutinePriority,
  intervalDaysForCadence,
  type CadenceType,
  type NextVisitStatus,
  type RoutineStatus,
  type RoutineType
} from '@/lib/recurring-care-engine'

export const dynamic = 'force-dynamic'

const allowedRoutineTypes = new Set(['appointment', 'medication', 'meal', 'wellbeing', 'rehab', 'documents', 'custom'])
const allowedCadenceTypes = new Set(['once', 'weekly', 'biweekly', 'monthly', 'every_3_months', 'every_6_months', 'yearly', 'custom'])
const allowedRoutineStatuses = new Set(['active', 'paused', 'completed', 'cancelled'])
const allowedDraftStatuses = new Set(['draft', 'family_review', 'appointment_requested', 'booked', 'done', 'cancelled'])

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

function numberOrNull(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
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
  const routineSelect = [
    'id',
    'elder_name',
    'routine_type',
    'title',
    'hospital_name',
    'department',
    'doctor_name',
    'cadence_type',
    'cadence_interval_days',
    'next_due_date',
    'preferred_day',
    'preferred_time',
    'family_owner_name',
    'family_owner_phone',
    'status',
    'reminder_channel',
    'memo',
    'ops_memo',
    'created_at',
    'updated_at'
  ].join(',')

  const draftSelect = [
    'id',
    'routine_schedule_id',
    'elder_name',
    'title',
    'hospital_name',
    'department',
    'doctor_name',
    'suggested_date',
    'preferred_time',
    'reason',
    'status',
    'priority',
    'family_owner_name',
    'family_owner_phone',
    'memo',
    'ops_memo',
    'booked_at',
    'completed_at',
    'created_at',
    'updated_at'
  ].join(',')

  const [routines, drafts] = await Promise.all([
    rest('care_routine_schedules?select=' + encodeURIComponent(routineSelect) + '&order=created_at.desc&limit=100'),
    rest('care_next_visit_drafts?select=' + encodeURIComponent(draftSelect) + '&order=created_at.desc&limit=100')
  ])

  if (!routines.ok) {
    return NextResponse.json(
      { ok: false, message: '정기 케어 목록을 불러오지 못했습니다. STEP16 SQL이 실행됐는지 확인해주세요.', detail: routines.error },
      { status: 500 }
    )
  }

  if (!drafts.ok) {
    return NextResponse.json(
      { ok: false, message: '다음 예약 후보를 불러오지 못했습니다. STEP16 SQL이 실행됐는지 확인해주세요.', detail: drafts.error },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    routines: Array.isArray(routines.data) ? routines.data : [],
    drafts: Array.isArray(drafts.data) ? drafts.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const elderName = text(body.elderName) || '부모님'
  const title = text(body.title)
  const routineTypeValue = text(body.routineType) || 'appointment'
  const cadenceTypeValue = text(body.cadenceType) || 'monthly'
  const customDays = numberOrNull(body.customDays)

  if (!title) {
    return NextResponse.json({ ok: false, message: '정기 케어 제목이 필요합니다.' }, { status: 400 })
  }

  if (!allowedRoutineTypes.has(routineTypeValue)) {
    return NextResponse.json({ ok: false, message: 'routineType이 올바르지 않습니다.' }, { status: 400 })
  }

  if (!allowedCadenceTypes.has(cadenceTypeValue)) {
    return NextResponse.json({ ok: false, message: 'cadenceType이 올바르지 않습니다.' }, { status: 400 })
  }

  const routineType = routineTypeValue as RoutineType
  const cadenceType = cadenceTypeValue as CadenceType

  const hospitalName = text(body.hospitalName)
  const department = text(body.department)
  const doctorName = text(body.doctorName)
  const firstDueDate = text(body.firstDueDate)
  const preferredDay = text(body.preferredDay)
  const preferredTime = text(body.preferredTime)
  const familyOwnerName = text(body.familyOwnerName)
  const familyOwnerPhone = text(body.familyOwnerPhone)
  const memo = text(body.memo)

  const intervalDays = intervalDaysForCadence(cadenceType, customDays)
  const nextDueDate = firstDueDate || calculateNextDueDate(new Date().toISOString().slice(0, 10), cadenceType, customDays)

  const routineInsert = await rest('care_routine_schedules', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: elderName,
        routine_type: routineType,
        title,
        hospital_name: hospitalName || null,
        department: department || null,
        doctor_name: doctorName || null,
        cadence_type: cadenceType,
        cadence_interval_days: intervalDays,
        next_due_date: nextDueDate,
        preferred_day: preferredDay || null,
        preferred_time: preferredTime || null,
        family_owner_name: familyOwnerName || null,
        family_owner_phone: familyOwnerPhone || null,
        status: 'active',
        reminder_channel: 'phone',
        memo: memo || null,
        created_by_role: 'family'
      }
    ])
  })

  if (!routineInsert.ok) {
    return NextResponse.json(
      { ok: false, message: '정기 케어 저장 중 오류가 발생했습니다.', detail: routineInsert.error },
      { status: 500 }
    )
  }

  const routine = Array.isArray(routineInsert.data) ? routineInsert.data[0] : null

  let draft: any = null

  if (routine?.id && nextDueDate) {
    const draftInsert = await rest('care_next_visit_drafts', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          routine_schedule_id: routine.id,
          elder_name: elderName,
          title: `${title} 다음 예약 후보`,
          hospital_name: hospitalName || null,
          department: department || null,
          doctor_name: doctorName || null,
          suggested_date: nextDueDate,
          preferred_time: preferredTime || null,
          reason: routineType === 'rehab' ? 'rehab' : routineType === 'medication' ? 'medication_review' : 'regular_check',
          status: 'draft',
          priority: inferRoutinePriority(routineType, nextDueDate),
          family_owner_name: familyOwnerName || null,
          family_owner_phone: familyOwnerPhone || null,
          memo: memo || null,
          created_by_role: 'system'
        }
      ])
    })

    if (draftInsert.ok && Array.isArray(draftInsert.data)) {
      draft = draftInsert.data[0]
    }

    if (draft?.id) {
      await rest('family_action_items?on_conflict=dedupe_key', {
        method: 'POST',
        headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
        body: JSON.stringify([
          {
            title: `${title} 다음 예약 확인하기`,
            description: `${elderName} ${title}의 다음 예약 후보가 만들어졌습니다. 예약을 맡길지 가족이 확인해주세요.`,
            category: 'appointment',
            priority: inferRoutinePriority(routineType, nextDueDate),
            status: 'pending',
            source_type: 'appointment',
            source_id: draft.id,
            dedupe_key: `routine:${routine.id}:next-visit:${nextDueDate}`,
            due_at: nextDueDate ? `${nextDueDate}T09:00:00+09:00` : null,
            created_by_role: 'system',
            memo: memo || null
          }
        ])
      })
    }
  }

  return NextResponse.json({
    ok: true,
    routine,
    draft
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const kind = text(body.kind)
  const id = text(body.id)
  const statusValue = text(body.status)
  const opsMemo = text(body.opsMemo)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (kind === 'routine') {
    if (!allowedRoutineStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'routine status가 올바르지 않습니다.' }, { status: 400 })
    }

    const result = await rest('care_routine_schedules?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        status: statusValue as RoutineStatus,
        ops_memo: opsMemo || null,
        updated_at: new Date().toISOString()
      })
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '정기 케어 상태 변경 실패', detail: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, item: Array.isArray(result.data) ? result.data[0] : result.data })
  }

  if (kind === 'draft') {
    if (!allowedDraftStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'draft status가 올바르지 않습니다.' }, { status: 400 })
    }

    const patch: Record<string, unknown> = {
      status: statusValue as NextVisitStatus,
      ops_memo: opsMemo || null,
      updated_at: new Date().toISOString()
    }

    if (statusValue === 'booked') patch.booked_at = new Date().toISOString()
    if (statusValue === 'done') patch.completed_at = new Date().toISOString()

    const result = await rest('care_next_visit_drafts?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '다음 예약 후보 상태 변경 실패', detail: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, item: Array.isArray(result.data) ? result.data[0] : result.data })
  }

  return NextResponse.json({ ok: false, message: 'kind는 routine 또는 draft여야 합니다.' }, { status: 400 })
}
