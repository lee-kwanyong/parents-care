import { NextResponse } from 'next/server'
import { supabaseSelect } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const result = await supabaseSelect(
    'anbu_notification_outbox?select=*&order=created_at.desc&limit=100'
  )

  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      message: '알림 발송함을 불러오지 못했습니다. Supabase SQL을 먼저 실행해주세요.',
      detail: result.error,
      items: []
    })
  }

  return NextResponse.json({
    ok: true,
    items: Array.isArray(result.data) ? result.data : []
  })
}
