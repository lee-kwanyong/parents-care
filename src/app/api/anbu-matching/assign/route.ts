import { NextRequest, NextResponse } from 'next/server'
import { supabaseInsert, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const requestId = text(body.requestId)
  const partnerId = text(body.partnerId)

  if (!requestId || !partnerId) {
    return NextResponse.json(
      {
        ok: false,
        message: '요청 ID와 파트너 ID가 필요합니다.'
      },
      { status: 400 }
    )
  }

  const result = await supabaseInsert('anbu_partner_matches', {
    request_id: requestId,
    partner_application_id: partnerId,
    match_status: 'assigned',
    memo: text(body.memo) || null
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '파트너 배정 저장 중 오류가 발생했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '케어파트너가 배정되었습니다.',
    match: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
