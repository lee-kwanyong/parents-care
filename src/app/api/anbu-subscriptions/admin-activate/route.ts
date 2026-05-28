import { NextRequest, NextResponse } from 'next/server'
import { supabaseInsert, supabaseSelect, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function familyExists(familyCode: string) {
  const result = await supabaseSelect(
    'anbu_family_links?select=family_code,parent_name,guardian_name&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null
  return result.data[0] as Record<string, unknown>
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const familyCode = text(body.familyCode)
  const planName = text(body.planName) || '안부온 베이직 운영실 승인'
  const days = Math.max(1, Math.min(Number(body.days || 30), 365))

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      { ok: false, message: '6자리 가족 연결코드를 입력해주세요.' },
      { status: 400 }
    )
  }

  const family = await familyExists(familyCode)

  if (!family) {
    return NextResponse.json(
      { ok: false, message: '해당 가족 연결코드를 찾지 못했습니다.' },
      { status: 404 }
    )
  }

  const startedAt = new Date()
  const endedAt = new Date(startedAt.getTime() + days * 24 * 60 * 60 * 1000)

  const insert = await supabaseInsert('anbu_subscriptions', {
    family_code: familyCode,
    plan_name: planName,
    status: 'active',
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    payload: {
      source: 'ops-manual-activate',
      days,
      family
    }
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '구독 활성화 저장 중 오류가 발생했습니다.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: `${days}일 구독이 활성화되었습니다.`,
    family,
    subscription: Array.isArray(insert.data) ? insert.data[0] : insert.data
  })
}
