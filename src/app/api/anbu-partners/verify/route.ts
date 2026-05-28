import { NextRequest, NextResponse } from 'next/server'
import { supabasePatch, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedStatuses = new Set(['new', 'reviewing', 'approved', 'hold', 'rejected', 'active', 'paused'])

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const id = text(body.id)
  const status = text(body.status)
  const memo = text(body.memo)

  if (!id) {
    return NextResponse.json({ ok: false, message: '파트너 신청 ID가 필요합니다.' }, { status: 400 })
  }

  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ ok: false, message: '올바르지 않은 상태값입니다.' }, { status: 400 })
  }

  const result = await supabasePatch(
    'anbu_care_partner_applications?id=eq.' + encodeURIComponent(id),
    {
      verification_status: status,
      memo: memo || undefined
    }
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '파트너 상태 변경 중 오류가 발생했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '파트너 상태가 변경되었습니다.',
    partner: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
