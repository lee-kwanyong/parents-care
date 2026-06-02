import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

type Suggestion = {
  sourceKey: string
  taskType: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function code6(value: unknown) {
  return text(value).replace(/[^\d]/g, '').slice(0, 6)
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function todayKstDateKey() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function dateDaysAgo(days: number) {
  const today = todayKstDateKey()
  const start = new Date(`${today}T00:00:00+09:00`)
  const d = new Date(start.getTime() - days * 24 * 60 * 60 * 1000)

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

async function rest(path: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
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

  const raw = await response.text()
  let parsed: unknown = null

  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = raw
  }

  return {
    ok: response.ok,
    status: response.status,
    data: parsed,
    error: response.ok ? null : parsed || raw
  }
}

async function loadTasks(familyCode: string) {
  const result = await rest(
    'family_action_tasks?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=created_at.desc&limit=200'
  )

  if (!result.ok || !Array.isArray(result.data)) {
    return {
      ok: false,
      tasks: [],
      error: result.error
    }
  }

  return {
    ok: true,
    tasks: result.data as Record<string, unknown>[],
    error: null
  }
}

async function loadRecentCheckins(familyCode: string) {
  const startDate = dateDaysAgo(14)

  const result = await rest(
    'daily_care_checkins?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&care_date=gte.' +
      encodeURIComponent(startDate) +
      '&order=occurred_at.desc&limit=1000'
  )

  if (!result.ok || !Array.isArray(result.data)) {
    return []
  }

  return result.data as Record<string, unknown>[]
}

function todayRows(rows: Record<string, unknown>[]) {
  const today = todayKstDateKey()

  return rows.filter((row) => text(row.care_date) === today)
}

function hasRow(rows: Record<string, unknown>[], type: string, slot: string) {
  return rows.find((row) => text(row.check_type) === type && text(row.check_slot || 'day') === slot)
}

function buildSuggestions(rows: Record<string, unknown>[], tasks: Record<string, unknown>[]) {
  const existingSourceKeys = new Set(
    tasks
      .filter((task) => text(task.status) !== 'done')
      .map((task) => text(task.source_key))
      .filter(Boolean)
  )

  const suggestions: Suggestion[] = []
  const today = todayRows(rows)

  function add(item: Suggestion) {
    if (existingSourceKeys.has(item.sourceKey)) return
    if (suggestions.some((suggestion) => suggestion.sourceKey === item.sourceKey)) return
    suggestions.push(item)
  }

  const mealSlots = [
    ['breakfast', '아침 식사'],
    ['lunch', '점심 식사'],
    ['dinner', '저녁 식사']
  ] as const

  for (const [slot, label] of mealSlots) {
    const row = hasRow(today, 'meal', slot)

    if (!row) {
      add({
        sourceKey: `missing-meal-${slot}`,
        taskType: 'meal-check',
        title: `${label} 확인하기`,
        description: `오늘 ${label} 기록이 아직 없습니다. 부모님께 식사 여부를 확인해주세요.`,
        priority: 'medium'
      })
    } else if (text(row.status) === 'not_done') {
      add({
        sourceKey: `risk-meal-${slot}`,
        taskType: 'meal-check',
        title: `${label} 챙기기`,
        description: `부모님이 "${text(row.care_label)}"를 선택했습니다. 식사 가능 여부를 확인해주세요.`,
        priority: 'high'
      })
    }
  }

  const medicationSlots = [
    ['morning', '아침약'],
    ['noon', '점심약'],
    ['evening', '저녁약']
  ] as const

  for (const [slot, label] of medicationSlots) {
    const row = hasRow(today, 'medication', slot)

    if (!row) {
      add({
        sourceKey: `missing-medication-${slot}`,
        taskType: 'medication-check',
        title: `${label} 확인하기`,
        description: `오늘 ${label} 기록이 아직 없습니다. 복약 여부를 확인해주세요.`,
        priority: 'medium'
      })
    } else if (text(row.status) === 'not_done') {
      add({
        sourceKey: `risk-medication-${slot}`,
        taskType: 'medication-check',
        title: `${label} 복용 확인하기`,
        description: `부모님이 "${text(row.care_label)}"를 선택했습니다. 복약 여부를 직접 확인해주세요.`,
        priority: 'high'
      })
    }
  }

  const condition = hasRow(today, 'condition', 'day')
  const emergency = hasRow(today, 'emergency', 'day')

  if (condition && text(condition.status) === 'needs_help') {
    add({
      sourceKey: 'condition-needs-help',
      taskType: 'condition-check',
      title: '몸이 불편한 곳 확인하기',
      description: '부모님이 몸이 불편하다고 선택했습니다. 전화로 상태를 확인해주세요.',
      priority: 'high'
    })
  }

  if (emergency && text(emergency.status) === 'needs_help') {
    add({
      sourceKey: 'emergency-needs-help',
      taskType: 'urgent-check',
      title: '도움 요청 즉시 확인',
      description: '부모님이 도움이 필요하다고 선택했습니다. 즉시 연락이 필요합니다.',
      priority: 'high'
    })
  }

  const riskCount = rows.filter((row) => ['not_done', 'needs_help'].includes(text(row.status))).length

  if (riskCount >= 3) {
    add({
      sourceKey: 'family-share-risk',
      taskType: 'family-share',
      title: '다른 가족에게 확인 요청',
      description: '최근 식사·복약·몸 상태에서 확인이 필요한 신호가 반복됩니다. 다른 가족과 역할을 나누세요.',
      priority: 'medium'
    })
  }

  if (suggestions.length === 0) {
    add({
      sourceKey: 'routine-check',
      taskType: 'routine-check',
      title: '오늘 저녁 안부 확인',
      description: '현재 큰 위험 신호는 없지만, 저녁에 한 번 더 안부를 확인하면 좋습니다.',
      priority: 'low'
    })
  }

  return suggestions.slice(0, 8)
}

export async function GET(request: NextRequest) {
  const familyCode =
    code6(request.nextUrl.searchParams.get('familyCode')) ||
    code6(request.cookies.get('anbu_guardian_family_code')?.value) ||
    code6(request.cookies.get('anbu_selected_family_code')?.value) ||
    code6(request.cookies.get('anbu_family_code')?.value)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족코드가 없습니다.'
      },
      { status: 400 }
    )
  }

  const taskResult = await loadTasks(familyCode)

  if (!taskResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 실행 보드를 불러오지 못했습니다.',
        detail: taskResult.error
      },
      { status: 500 }
    )
  }

  const checkins = await loadRecentCheckins(familyCode)
  const suggestions = buildSuggestions(checkins, taskResult.tasks)

  return NextResponse.json({
    ok: true,
    familyCode,
    tasks: taskResult.tasks,
    suggestions
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode = code6(body.familyCode)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족코드가 없습니다.'
      },
      { status: 400 }
    )
  }

  const title = text(body.title)

  if (!title) {
    return NextResponse.json(
      {
        ok: false,
        message: '실행 제목을 입력해주세요.'
      },
      { status: 400 }
    )
  }

  const payload = {
    family_code: familyCode,
    task_type: text(body.taskType) || 'check',
    title,
    description: text(body.description),
    priority: text(body.priority) || 'medium',
    status: text(body.status) || 'todo',
    assigned_to_name: text(body.assignedToName),
    created_by_name: text(body.createdByName),
    source: text(body.source) || 'manual',
    source_key: text(body.sourceKey),
    payload: body,
    updated_at: new Date().toISOString()
  }

  const result = await rest('family_action_tasks', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 실행을 저장하지 못했습니다. Supabase SQL을 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '가족 실행이 추가되었습니다.',
    task: Array.isArray(result.data) ? result.data[0] : result.data
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const taskId = text(body.taskId || body.id)
  const status = text(body.status)

  if (!taskId) {
    return NextResponse.json(
      {
        ok: false,
        message: '실행 ID가 없습니다.'
      },
      { status: 400 }
    )
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (status) {
    updatePayload.status = status
  }

  if (text(body.assignedToName)) {
    updatePayload.assigned_to_name = text(body.assignedToName)
  }

  if (text(body.completedNote)) {
    updatePayload.completed_note = text(body.completedNote)
  }

  if (status === 'done') {
    updatePayload.completed_at = new Date().toISOString()
  }

  if (status && status !== 'done') {
    updatePayload.completed_at = null
  }

  const result = await rest('family_action_tasks?id=eq.' + encodeURIComponent(taskId), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(updatePayload)
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 실행 상태를 변경하지 못했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '가족 실행 상태가 변경되었습니다.',
    task: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
