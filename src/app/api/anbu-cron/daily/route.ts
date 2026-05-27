import { NextRequest, NextResponse } from 'next/server'
import { supabaseInsert, supabaseSelect, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function checkCronSecret(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ''
  const provided =
    request.headers.get('x-cron-secret') ||
    request.nextUrl.searchParams.get('secret') ||
    ''

  if (!secret) return true
  return provided === secret
}

async function createFamilyDailyReminder(family: Record<string, unknown>) {
  const familyCode = text(family.family_code)
  const parentName = text(family.parent_name) || '부모님'

  return supabaseInsert('anbu_notification_outbox', {
    channel: 'app',
    family_code: familyCode || null,
    to_name: parentName,
    title: '오늘 안부를 확인해주세요',
    body: `${parentName}의 식사, 약, 몸 상태를 확인할 시간입니다.`,
    reason: 'daily-anbu-cron',
    target_url: '/parent/today',
    status: 'queued',
    payload: {
      source: 'daily-cron',
      family
    }
  })
}

export async function GET(request: NextRequest) {
  if (!checkCronSecret(request)) {
    return NextResponse.json(
      { ok: false, message: 'Cron Secret이 올바르지 않습니다.' },
      { status: 401 }
    )
  }

  const families = await supabaseSelect(
    'anbu_family_links?select=family_code,parent_name,guardian_name,link_status&link_status=eq.active&limit=200'
  )

  if (!families.ok || !Array.isArray(families.data)) {
    const fallback = await supabaseInsert('anbu_notification_outbox', {
      channel: 'app',
      title: '오늘 안부를 확인해주세요',
      body: '부모님의 식사, 약, 몸 상태를 확인할 시간입니다.',
      reason: 'daily-anbu-cron-fallback',
      target_url: '/parent/today',
      status: 'queued',
      payload: {
        source: 'daily-cron',
        fallback: true,
        detail: families.error
      }
    })

    return NextResponse.json({
      ok: true,
      mode: 'fallback',
      message: '가족 연결 테이블을 불러오지 못해 기본 알림 1건을 생성했습니다.',
      created: [fallback]
    })
  }

  const created = []

  for (const family of families.data as Array<Record<string, unknown>>) {
    created.push(await createFamilyDailyReminder(family))
  }

  return NextResponse.json({
    ok: true,
    mode: 'families',
    count: created.length,
    created
  })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
