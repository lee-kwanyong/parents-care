import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return NextResponse.json({ ok: true, mode: 'demo', message: '안심케어 접수 API 데모', received: body })
  }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('create_care_intake_request', {
    worry_input: typeof body.category === 'string' ? body.category : 'not_sure',
    channel_input: typeof body.channel === 'string' ? body.channel : 'api',
    memo_input: typeof body.memo === 'string' ? body.memo : JSON.stringify(body),
    social_care_input: Boolean(body.socialCare),
    contact_name_input: typeof body.contactName === 'string' ? body.contactName : null,
    contact_phone_input: typeof body.contactPhone === 'string' ? body.contactPhone : null
  })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
}
