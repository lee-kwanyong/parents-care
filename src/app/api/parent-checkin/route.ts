import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

type SaveMode = 'inserted' | 'updated'

type SaveResult =
  | {
      ok: true
      mode: SaveMode
      status: number
      data: unknown
      error: null
    }
  | {
      ok: false
      status: number
      data: null
      error: unknown
    }

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function code6(value: unknown) {
  return text(value).replace(/[^\d]/g, '').slice(0, 6)
}

function normalizeSlot(value: unknown) {
  const slot = text(value)

  if (['breakfast', 'lunch', 'dinner', 'morning', 'noon', 'evening', 'day'].includes(slot)) {
    return slot
  }

  return 'day'
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

async function findFamily(familyCode: string) {
  const result = await rest(
    'anbu_family_links?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=created_at.desc&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null

  return result.data[0] as Record<string, unknown>
}

async function findTodayExisting(familyCode: string, checkType: string, checkSlot: string, careDate: string) {
  const result = await rest(
    'daily_care_checkins?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&check_type=eq.' +
      encodeURIComponent(checkType) +
      '&check_slot=eq.' +
      encodeURIComponent(checkSlot) +
      '&care_date=eq.' +
      encodeURIComponent(careDate) +
      '&order=occurred_at.desc&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null

  return result.data[0] as Record<string, unknown>
}

async function saveSingleChoice(payload: {
  familyCode: string
  elderName: string
  checkType: string
  checkSlot: string
  careDate: string
  careLabel: string
  status: string
  memo: string
}): Promise<SaveResult> {
  const existing = await findTodayExisting(
    payload.familyCode,
    payload.checkType,
    payload.checkSlot,
    payload.careDate
  )

  if (existing?.id) {
    const update = await rest('daily_care_checkins?id=eq.' + encodeURIComponent(String(existing.id)), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        elder_name: payload.elderName,
        check_slot: payload.checkSlot,
        care_date: payload.careDate,
        care_label: payload.careLabel,
        status: payload.status,
        memo: payload.memo,
        occurred_at: new Date().toISOString()
      })
    })

    if (update.ok) {
      return {
        ok: true,
        mode: 'updated',
        status: update.status,
        data: update.data,
        error: null
      }
    }

    return {
      ok: false,
      status: update.status,
      data: null,
      error: {
        message: '기존 선택을 교체하지 못했습니다.',
        update: update.error
      }
    }
  }

  const insert = await rest('daily_care_checkins', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_code: payload.familyCode,
        elder_name: payload.elderName,
        check_type: payload.checkType,
        check_slot: payload.checkSlot,
        care_date: payload.careDate,
        care_label: payload.careLabel,
        status: payload.status,
        memo: payload.memo,
        occurred_at: new Date().toISOString()
      }
    ])
  })

  if (insert.ok) {
    return {
      ok: true,
      mode: 'inserted',
      status: insert.status,
      data: insert.data,
      error: null
    }
  }

  return {
    ok: false,
    status: insert.status,
    data: null,
    error: {
      message: '선택을 저장하지 못했습니다.',
      insert: insert.error
    }
  }
}

async function loadTodayChoices(familyCode: string, careDate: string) {
  const result = await rest(
    'daily_care_checkins?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&care_date=eq.' +
      encodeURIComponent(careDate) +
      '&order=occurred_at.desc'
  )

  if (!result.ok || !Array.isArray(result.data)) {
    return {
      ok: false,
      choices: {},
      rows: [],
      error: result.error
    }
  }

  const choices: Record<string, unknown> = {}

  for (const row of result.data as Record<string, unknown>[]) {
    const key = `${text(row.check_type)}:${text(row.check_slot) || 'day'}`

    if (!choices[key]) {
      choices[key] = row
    }
  }

  return {
    ok: true,
    choices,
    rows: result.data,
    error: null
  }
}

function checkTypeLabel(checkType: string) {
  if (checkType === 'meal') return '식사'
  if (checkType === 'medication') return '복약'
  if (checkType === 'condition') return '몸 상태'
  if (checkType === 'emergency') return '도움 요청'
  return '안부'
}

export async function GET(request: NextRequest) {
  const familyCode =
    code6(request.nextUrl.searchParams.get('familyCode')) ||
    code6(request.cookies.get('anbu_family_code')?.value) ||
    code6(request.cookies.get('pc_parent_invite_code')?.value) ||
    code6(request.cookies.get('anbu_parent_code')?.value) ||
    code6(request.cookies.get('parent_family_code')?.value)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 연결이 없습니다.'
      },
      { status: 401 }
    )
  }

  const careDate = todayKstDateKey()
  const result = await loadTodayChoices(familyCode, careDate)

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '오늘 안부 선택을 불러오지 못했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    careDate,
    choices: result.choices,
    rows: result.rows
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode =
    code6(body.familyCode) ||
    code6(request.cookies.get('anbu_family_code')?.value) ||
    code6(request.cookies.get('pc_parent_invite_code')?.value) ||
    code6(request.cookies.get('anbu_parent_code')?.value) ||
    code6(request.cookies.get('parent_family_code')?.value)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 연결이 없습니다. 6자리 코드를 다시 입력해주세요.'
      },
      { status: 401 }
    )
  }

  const checkType = text(body.checkType) || 'condition'
  const checkSlot = normalizeSlot(body.checkSlot)
  const careDate = todayKstDateKey()
  const careLabel = text(body.careLabel) || '안부 확인'
  const status = text(body.status) || 'done'
  const memo = text(body.memo) || careLabel

  const family = await findFamily(familyCode)

  const result = await saveSingleChoice({
    familyCode,
    elderName: family ? text(family.parent_name) || '부모님' : '부모님',
    checkType,
    checkSlot,
    careDate,
    careLabel,
    status,
    memo
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안부 저장에 실패했습니다. Supabase SQL Editor에서 20260602_parent_choice_data_report.sql을 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  const groupLabel = checkTypeLabel(checkType)

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    careDate,
    message:
      result.mode === 'updated'
        ? `${groupLabel} 선택이 ${careLabel}(으)로 변경되었습니다.`
        : `${careLabel} 기록이 자녀 리포트에 저장되었습니다.`,
    checkin: Array.isArray(result.data) ? result.data[0] : result.data,
    session: {
      familyCode,
      parentName: family ? text(family.parent_name) || '부모님' : '부모님',
      guardianName: family ? text(family.guardian_name) || '보호자' : '보호자',
      role: 'parent',
      loggedIn: true,
      connected: true,
      verified: true
    }
  })
}
