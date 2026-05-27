import { NextRequest, NextResponse } from 'next/server'
import { buildWeeklyReport } from '@/lib/anbu-weekly-report'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    return {
      ok: false,
      data: null as unknown,
      error: 'Supabase env is missing'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

async function findFamily(request: NextRequest) {
  const requested =
    request.nextUrl.searchParams.get('familyCode') ||
    request.cookies.get('anbu_family_code')?.value ||
    request.cookies.get('pc_parent_invite_code')?.value ||
    ''

  if (requested) {
    const found = await rest(
      'anbu_family_links?select=family_code,parent_name,guardian_name&family_code=eq.' +
        encodeURIComponent(requested) +
        '&limit=1'
    )

    if (found.ok && Array.isArray(found.data) && found.data[0]) {
      return found.data[0] as {
        family_code?: string
        parent_name?: string
        guardian_name?: string
      }
    }

    return {
      family_code: requested,
      parent_name: '부모님',
      guardian_name: '보호자'
    }
  }

  const latest = await rest(
    'anbu_family_links?select=family_code,parent_name,guardian_name&link_status=eq.active&order=created_at.desc&limit=1'
  )

  if (latest.ok && Array.isArray(latest.data) && latest.data[0]) {
    return latest.data[0] as {
      family_code?: string
      parent_name?: string
      guardian_name?: string
    }
  }

  return {
    family_code: '',
    parent_name: '부모님',
    guardian_name: '보호자'
  }
}

function sinceIso(days = 8) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export async function GET(request: NextRequest) {
  const family = await findFamily(request)
  const familyCode = family.family_code || ''

  if (!familyCode) {
    return NextResponse.json({
      ok: true,
      empty: true,
      message: '연결된 부모님 가족 코드가 없습니다. /family-link에서 먼저 연결코드를 만들어주세요.',
      report: buildWeeklyReport({
        familyCode: '',
        parentName: '부모님',
        guardianName: '보호자',
        checkins: [],
        notifications: [],
        schedules: []
      })
    })
  }

  const since = sinceIso(8)

  const checkinsResult = await rest(
    'daily_care_checkins?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&occurred_at=gte.' +
      encodeURIComponent(since) +
      '&order=occurred_at.desc&limit=500'
  )

  const notificationsResult = await rest(
    'anbu_notification_outbox?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&created_at=gte.' +
      encodeURIComponent(since) +
      '&order=created_at.desc&limit=500'
  )

  const schedulesResult = await rest(
    'anbu_schedules?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=schedule_date.asc&limit=200'
  )

  const checkins = checkinsResult.ok && Array.isArray(checkinsResult.data) ? checkinsResult.data : []
  const notifications = notificationsResult.ok && Array.isArray(notificationsResult.data) ? notificationsResult.data : []
  const schedules = schedulesResult.ok && Array.isArray(schedulesResult.data) ? schedulesResult.data : []

  const report = buildWeeklyReport({
    familyCode,
    parentName: family.parent_name || '부모님',
    guardianName: family.guardian_name || '보호자',
    checkins,
    notifications,
    schedules
  })

  return NextResponse.json({
    ok: true,
    family,
    report,
    diagnostics: {
      checkinsOk: checkinsResult.ok,
      notificationsOk: notificationsResult.ok,
      schedulesOk: schedulesResult.ok,
      checkinsError: checkinsResult.ok ? null : checkinsResult.error,
      notificationsError: notificationsResult.ok ? null : notificationsResult.error,
      schedulesError: schedulesResult.ok ? null : schedulesResult.error
    }
  })
}
