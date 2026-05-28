import { NextRequest, NextResponse } from 'next/server'
import { supabaseInsert, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const guardianName = text(body.guardianName)
  const guardianPhone = text(body.guardianPhone)
  const parentName = text(body.parentName)
  const region = text(body.region)
  const requestType = text(body.requestType)

  if (!guardianName || !guardianPhone || !parentName || !region || !requestType) {
    return NextResponse.json(
      {
        ok: false,
        message: '보호자 이름, 보호자 연락처, 부모님 이름, 지역, 요청 유형은 필수입니다.'
      },
      { status: 400 }
    )
  }

  const result = await supabaseInsert('anbu_care_requests', {
    family_code: text(body.familyCode) || null,
    guardian_name: guardianName,
    guardian_phone: guardianPhone,
    parent_name: parentName,
    region,
    request_type: requestType,
    preferred_date: text(body.preferredDate) || null,
    preferred_time: text(body.preferredTime) || null,
    details: text(body.details) || null,
    status: 'requested'
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '케어 요청 저장 중 오류가 발생했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '케어 요청이 접수되었습니다.',
    request: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
