import { NextRequest, NextResponse } from 'next/server'
import { requireAdminCode, supabaseRest, text } from '@/lib/anbu-supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function rows(data: unknown) {
  return Array.isArray(data) ? data : []
}

const allowedRequestTypes = new Set([
  'delete_account',
  'delete_parent_data',
  'export_data',
  'correct_data',
  'withdraw_consent',
  'contact'
])

export async function GET(request: NextRequest) {
  const adminCode = request.nextUrl.searchParams.get('adminCode') || ''
  const admin = requireAdminCode(adminCode)

  if (!admin.ok) {
    return NextResponse.json({ ok: false, message: admin.message }, { status: admin.status })
  }

  const result = await supabaseRest('anbu_data_requests?select=*&order=created_at.desc&limit=300')

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '데이터 요청 목록을 불러오지 못했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    requests: rows(result.data)
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const requestType = text(body.requestType)

  if (!allowedRequestTypes.has(requestType)) {
    return NextResponse.json(
      { ok: false, message: '지원하지 않는 요청 유형입니다.' },
      { status: 400 }
    )
  }

  if (!body.consent) {
    return NextResponse.json(
      { ok: false, message: '요청 처리를 위한 개인정보 확인 동의가 필요합니다.' },
      { status: 400 }
    )
  }

  const requesterName = text(body.requesterName)
  const phone = text(body.phone)
  const email = text(body.email)
  const details = text(body.details)

  if (!requesterName) {
    return NextResponse.json({ ok: false, message: '이름을 입력해주세요.' }, { status: 400 })
  }

  if (!phone && !email) {
    return NextResponse.json({ ok: false, message: '연락처 또는 이메일 중 하나는 입력해주세요.' }, { status: 400 })
  }

  if (!details) {
    return NextResponse.json({ ok: false, message: '요청 내용을 입력해주세요.' }, { status: 400 })
  }

  const result = await supabaseRest('anbu_data_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        request_type: requestType,
        requester_name: requesterName,
        phone: phone || null,
        email: email || null,
        family_code: text(body.familyCode) || null,
        details,
        request_status: 'received'
      }
    ])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '요청 저장에 실패했습니다. /setup/legal에서 DB 설정을 확인해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    request: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
