import { NextRequest, NextResponse } from 'next/server'
import { bool, requireAdminCode, supabaseRest, text } from '@/lib/anbu-supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function rows(data: unknown) {
  return Array.isArray(data) ? data : []
}

export async function GET(request: NextRequest) {
  const adminCode = request.nextUrl.searchParams.get('adminCode') || ''
  const admin = requireAdminCode(adminCode)

  if (!admin.ok) {
    return NextResponse.json({ ok: false, message: admin.message }, { status: admin.status })
  }

  const result = await supabaseRest(
    'anbu_partner_applications?select=*&order=created_at.desc&limit=300'
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '케어파트너 신청 목록을 불러오지 못했습니다. /setup/partners에서 DB 설정을 확인해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    applications: rows(result.data)
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'update_status') {
    const admin = requireAdminCode(text(body.adminCode))

    if (!admin.ok) {
      return NextResponse.json({ ok: false, message: admin.message }, { status: admin.status })
    }

    const id = text(body.id)
    const status = text(body.status)

    if (!id) {
      return NextResponse.json({ ok: false, message: '파트너 신청 ID가 필요합니다.' }, { status: 400 })
    }

    if (!['pending', 'approved', 'rejected', 'hold'].includes(status)) {
      return NextResponse.json({ ok: false, message: '지원하지 않는 상태입니다.' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const patch: Record<string, unknown> = {
      verification_status: status,
      verification_memo: text(body.verificationMemo) || null,
      updated_at: now
    }

    if (status === 'approved') patch.approved_at = now
    if (status === 'rejected') patch.rejected_at = now

    const result = await supabaseRest('anbu_partner_applications?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: '파트너 상태 변경에 실패했습니다.', detail: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      application: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  const applicantName = text(body.applicantName)
  const phone = text(body.phone)

  if (!applicantName) {
    return NextResponse.json({ ok: false, message: '이름을 입력해주세요.' }, { status: 400 })
  }

  if (!phone) {
    return NextResponse.json({ ok: false, message: '연락처를 입력해주세요.' }, { status: 400 })
  }

  const payload = {
    applicant_name: applicantName,
    phone,
    email: text(body.email) || null,
    region: text(body.region) || null,
    available_time: text(body.availableTime) || null,
    has_caregiver_license: bool(body.hasCaregiverLicense),
    can_hospital_accompany: bool(body.canHospitalAccompany),
    can_medication_check: bool(body.canMedicationCheck),
    can_meal_check: bool(body.canMealCheck),
    can_drive: bool(body.canDrive),
    memo: text(body.memo) || null,
    verification_status: 'pending'
  }

  const result = await supabaseRest('anbu_partner_applications', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '케어파트너 신청 저장에 실패했습니다. /setup/partners에서 DB 설정을 확인해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    application: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
