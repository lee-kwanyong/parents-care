import { NextRequest, NextResponse } from 'next/server'
import { supabaseInsert } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function yes(value: unknown) {
  const raw = text(value)
  return ['yes', 'true', '가능', '있음', '보유', '1', 'on'].includes(raw)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const applicantName = text(body.applicantName)
  const phone = text(body.phone)
  const region = text(body.region)

  if (!applicantName || !phone || !region) {
    return NextResponse.json(
      {
        ok: false,
        message: '이름, 연락처, 활동 가능 지역은 필수입니다.'
      },
      { status: 400 }
    )
  }

  const memo = JSON.stringify({
    email: text(body.email),
    expectedFee: text(body.expectedFee),
    intro: text(body.intro),
    experience: text(body.experience),
    source: 'care-partner-apply',
    submittedAt: new Date().toISOString()
  })

  const inserted = await supabaseInsert('anbu_care_partner_applications', {
    applicant_name: applicantName,
    phone,
    region,
    available_time: text(body.availableTime),
    has_caregiver_license: yes(body.hasCaregiverLicense),
    can_hospital_accompany: yes(body.canHospitalAccompany),
    can_medication_check: yes(body.canMedicationCheck),
    can_meal_check: yes(body.canMealCheck),
    can_drive: yes(body.canDrive),
    verification_status: 'new',
    memo
  })

  if (!inserted.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '케어파트너 신청 저장 중 오류가 발생했습니다. Supabase 테이블을 확인해주세요.',
        detail: inserted.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '케어파트너 신청이 접수되었습니다.',
    application: Array.isArray(inserted.data) ? inserted.data[0] : inserted.data
  })
}
