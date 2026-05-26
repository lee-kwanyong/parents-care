import { NextRequest, NextResponse } from 'next/server'
import { firstRow, requireAdminCode, supabaseRest, text } from '@/lib/anbu-supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PartnerApplicationRow = {
  id: string
  applicant_name?: string | null
  phone?: string | null
  region?: string | null
  verification_status?: string | null
}

function rows(data: unknown) {
  return Array.isArray(data) ? data : []
}

export async function GET(request: NextRequest) {
  const adminCode = request.nextUrl.searchParams.get('adminCode') || ''
  const queryFamilyCode = request.nextUrl.searchParams.get('familyCode') || ''
  const cookieFamilyCode =
    request.cookies.get('anbu_family_code')?.value ||
    request.cookies.get('pc_parent_invite_code')?.value ||
    ''

  const isAdminRequest = Boolean(adminCode)

  if (isAdminRequest) {
    const admin = requireAdminCode(adminCode)

    if (!admin.ok) {
      return NextResponse.json({ ok: false, message: admin.message }, { status: admin.status })
    }
  }

  const familyCode = queryFamilyCode || cookieFamilyCode

  let path = 'anbu_care_assignments?select=*&order=created_at.desc&limit=300'

  if (!isAdminRequest) {
    if (!familyCode) {
      return NextResponse.json({
        ok: true,
        assignments: [],
        message: '연결된 부모님 코드가 없습니다.'
      })
    }

    path += '&family_code=eq.' + encodeURIComponent(familyCode)
  }

  const result = await supabaseRest(path)

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '케어 배정 목록을 불러오지 못했습니다. /setup/partners에서 DB 설정을 확인해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    assignments: rows(result.data)
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)
  const admin = requireAdminCode(text(body.adminCode))

  if (!admin.ok) {
    return NextResponse.json({ ok: false, message: admin.message }, { status: admin.status })
  }

  if (action === 'update_status') {
    const id = text(body.id)
    const status = text(body.status)

    if (!id) {
      return NextResponse.json({ ok: false, message: '배정 ID가 필요합니다.' }, { status: 400 })
    }

    if (!['assigned', 'confirmed', 'in_progress', 'completed', 'cancelled', 'hold'].includes(status)) {
      return NextResponse.json({ ok: false, message: '지원하지 않는 배정 상태입니다.' }, { status: 400 })
    }

    const result = await supabaseRest('anbu_care_assignments?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        assignment_status: status,
        report_summary: text(body.reportSummary) || null,
        updated_at: new Date().toISOString()
      })
    })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: '배정 상태 변경에 실패했습니다.', detail: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      assignment: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  const familyCode = text(body.familyCode)
  const partnerApplicationId = text(body.partnerApplicationId)
  const taskTitle = text(body.taskTitle)
  const taskType = text(body.taskType) || '생활확인'

  if (!familyCode) {
    return NextResponse.json({ ok: false, message: '부모님 연결코드가 필요합니다.' }, { status: 400 })
  }

  if (!partnerApplicationId) {
    return NextResponse.json({ ok: false, message: '배정할 케어파트너를 선택해주세요.' }, { status: 400 })
  }

  if (!taskTitle) {
    return NextResponse.json({ ok: false, message: '배정 업무 제목을 입력해주세요.' }, { status: 400 })
  }

  const partnerResult = await supabaseRest(
    'anbu_partner_applications?select=id,applicant_name,phone,region,verification_status&id=eq.' +
      encodeURIComponent(partnerApplicationId) +
      '&limit=1'
  )

  if (!partnerResult.ok) {
    return NextResponse.json(
      { ok: false, message: '케어파트너 정보를 불러오지 못했습니다.', detail: partnerResult.error },
      { status: 500 }
    )
  }

  const partner = firstRow<PartnerApplicationRow>(partnerResult.data)

  if (!partner) {
    return NextResponse.json({ ok: false, message: '케어파트너를 찾지 못했습니다.' }, { status: 404 })
  }

  if (partner.verification_status !== 'approved') {
    return NextResponse.json({ ok: false, message: '승인된 케어파트너만 배정할 수 있습니다.' }, { status: 400 })
  }

  const scheduledAt = text(body.scheduledAt)

  const payload = {
    family_code: familyCode,
    partner_application_id: partner.id,
    partner_name: partner.applicant_name || '케어파트너',
    partner_phone: partner.phone || null,
    partner_region: partner.region || null,
    task_type: taskType,
    task_title: taskTitle,
    task_description: text(body.taskDescription) || null,
    scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    assignment_status: 'assigned',
    ops_memo: text(body.opsMemo) || null
  }

  const result = await supabaseRest('anbu_care_assignments', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '케어 배정 저장에 실패했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    assignment: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
