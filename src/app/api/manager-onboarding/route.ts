import { NextRequest, NextResponse } from 'next/server'
import {
  buildManagerTrustSummary,
  type ManagerApplicationStatus,
  type ManagerTrustLevel,
  type ManagerType
} from '@/lib/manager-onboarding-engine'

export const dynamic = 'force-dynamic'

const allowedStatuses = new Set([
  'draft',
  'submitted',
  'document_review',
  'interview_scheduled',
  'training_pending',
  'approved',
  'waitlisted',
  'rejected',
  'suspended'
])

const allowedManagerTypes = new Set([
  'hospital_companion',
  'meal_check',
  'discharge_check',
  'document_helper',
  'wellbeing_check',
  'multi_care'
])

const allowedTrustLevels = new Set(['review', 'basic', 'standard', 'trusted', 'hold'])

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 'on'
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function arrayText(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(String).map((item) => item.trim()).filter(Boolean)
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase env is missing' }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return { ok: false, data: parsed, error: parsed || bodyText }
  }

  return { ok: true, data: parsed, error: null }
}

async function insertEvent(input: {
  applicationId?: string | null
  profileId?: string | null
  eventType: string
  title: string
  description?: string | null
  actorRole?: 'applicant' | 'ops' | 'system'
}) {
  await rest('care_manager_screening_events', {
    method: 'POST',
    body: JSON.stringify([
      {
        manager_application_id: input.applicationId || null,
        manager_profile_id: input.profileId || null,
        event_type: input.eventType,
        title: input.title,
        description: input.description || null,
        actor_role: input.actorRole || 'ops'
      }
    ])
  })
}

export async function GET() {
  const applicationSelect = [
    'id',
    'applicant_name',
    'applicant_phone',
    'birth_year',
    'address_text',
    'preferred_contact',
    'application_status',
    'manager_type',
    'certifications',
    'career_years',
    'career_summary',
    'available_regions',
    'available_days',
    'available_time_slots',
    'specialties',
    'service_scopes',
    'digital_skills',
    'vehicle_owned',
    'driving_license_owned',
    'understands_transport_policy',
    'direct_transport_included',
    'cpr_certified',
    'background_check_consent',
    'privacy_agreement',
    'service_policy_agreement',
    'intro_text',
    'motivation_text',
    'review_score',
    'trust_level',
    'ops_memo',
    'rejection_reason',
    'submitted_at',
    'reviewed_at',
    'approved_at',
    'rejected_at',
    'created_at',
    'updated_at'
  ].join(',')

  const profileSelect = [
    'id',
    'application_id',
    'manager_name',
    'manager_phone',
    'profile_status',
    'trust_level',
    'certifications',
    'available_regions',
    'specialties',
    'service_scopes',
    'vehicle_owned',
    'driving_license_owned',
    'direct_transport_included',
    'trust_card_summary',
    'public_notes',
    'completed_cases',
    'rating_safety',
    'rating_kindness',
    'rating_accuracy',
    'rating_punctuality',
    'approved_at',
    'created_at',
    'updated_at'
  ].join(',')

  const eventSelect = [
    'id',
    'manager_application_id',
    'manager_profile_id',
    'event_type',
    'title',
    'description',
    'actor_role',
    'created_at'
  ].join(',')

  const [applications, profiles, events] = await Promise.all([
    rest('care_manager_applications?select=' + encodeURIComponent(applicationSelect) + '&order=created_at.desc&limit=200'),
    rest('care_manager_profiles?select=' + encodeURIComponent(profileSelect) + '&order=created_at.desc&limit=200'),
    rest('care_manager_screening_events?select=' + encodeURIComponent(eventSelect) + '&order=created_at.desc&limit=300')
  ])

  if (!applications.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '매니저 지원 목록을 불러오지 못했습니다. 매니저 등록 SQL이 실행됐는지 확인해주세요.',
        detail: applications.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    applications: Array.isArray(applications.data) ? applications.data : [],
    profiles: profiles.ok && Array.isArray(profiles.data) ? profiles.data : [],
    events: events.ok && Array.isArray(events.data) ? events.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'create_application'

  if (action !== 'create_application') {
    return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
  }

  const applicantName = text(body.applicantName)
  const applicantPhone = text(body.applicantPhone)

  if (!applicantName || !applicantPhone) {
    return NextResponse.json({ ok: false, message: '이름과 연락처가 필요합니다.' }, { status: 400 })
  }

  const managerTypeValue = text(body.managerType) || 'hospital_companion'
  const managerType: ManagerType = allowedManagerTypes.has(managerTypeValue) ? (managerTypeValue as ManagerType) : 'hospital_companion'

  const certifications = arrayText(body.certifications)
  const availableRegions = arrayText(body.availableRegions)
  const availableDays = arrayText(body.availableDays)
  const availableTimeSlots = arrayText(body.availableTimeSlots)
  const specialties = arrayText(body.specialties)
  const serviceScopes = arrayText(body.serviceScopes)
  const digitalSkills = arrayText(body.digitalSkills)

  const vehicleOwned = bool(body.vehicleOwned)
  const drivingLicenseOwned = bool(body.drivingLicenseOwned)
  const understandsTransportPolicy = bool(body.understandsTransportPolicy)

  const row = {
    applicant_name: applicantName,
    applicant_phone: applicantPhone,
    birth_year: numberValue(body.birthYear, 0) || null,
    address_text: text(body.addressText) || null,
    preferred_contact: text(body.preferredContact) || 'phone',
    application_status: 'submitted',
    manager_type: managerType,
    certifications,
    career_years: numberValue(body.careerYears, 0),
    career_summary: text(body.careerSummary) || null,
    available_regions: availableRegions,
    available_days: availableDays,
    available_time_slots: availableTimeSlots,
    specialties,
    service_scopes: serviceScopes,
    digital_skills: digitalSkills,
    vehicle_owned: vehicleOwned,
    driving_license_owned: drivingLicenseOwned,
    understands_transport_policy: understandsTransportPolicy,
    direct_transport_included: false,
    cpr_certified: certifications.includes('심폐소생술 교육 이수') || bool(body.cprCertified),
    background_check_consent: bool(body.backgroundCheckConsent),
    privacy_agreement: bool(body.privacyAgreement),
    service_policy_agreement: bool(body.servicePolicyAgreement),
    intro_text: text(body.introText) || null,
    motivation_text: text(body.motivationText) || null,
    trust_level: 'review',
    submitted_at: new Date().toISOString()
  }

  const insert = await rest('care_manager_applications', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([row])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '매니저 지원서 저장 중 오류가 발생했습니다.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  const application = Array.isArray(insert.data) ? insert.data[0] : insert.data

  await insertEvent({
    applicationId: application?.id || null,
    eventType: 'submitted',
    title: '매니저 지원서 접수',
    description: `${applicantName}님의 지원서가 접수됐습니다.`,
    actorRole: 'applicant'
  })

  return NextResponse.json({
    ok: true,
    application
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const id = text(body.id)
  const statusValue = text(body.status)
  const trustLevelValue = text(body.trustLevel) || 'basic'
  const opsMemo = text(body.opsMemo)
  const rejectionReason = text(body.rejectionReason)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (!allowedStatuses.has(statusValue)) {
    return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
  }

  const status = statusValue as ManagerApplicationStatus
  const trustLevel: ManagerTrustLevel = allowedTrustLevels.has(trustLevelValue) ? (trustLevelValue as ManagerTrustLevel) : 'basic'

  const patch: Record<string, unknown> = {
    application_status: status,
    updated_at: new Date().toISOString()
  }

  if (status === 'document_review') patch.reviewed_at = new Date().toISOString()
  if (status === 'approved') {
    patch.approved_at = new Date().toISOString()
    patch.trust_level = trustLevel === 'review' || trustLevel === 'hold' ? 'basic' : trustLevel
    patch.review_score = numberValue(body.reviewScore, 80)
  }
  if (status === 'rejected') {
    patch.rejected_at = new Date().toISOString()
    patch.rejection_reason = rejectionReason || '운영실 심사 기준 미충족'
    patch.trust_level = 'hold'
  }
  if (opsMemo) patch.ops_memo = opsMemo

  const update = await rest('care_manager_applications?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  if (!update.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '매니저 지원 상태 변경 실패',
        detail: update.error
      },
      { status: 500 }
    )
  }

  const application = Array.isArray(update.data) ? update.data[0] : update.data

  await insertEvent({
    applicationId: id,
    eventType: status === 'approved' ? 'approved' : status,
    title: `지원 상태 변경: ${status}`,
    description: opsMemo || rejectionReason || null,
    actorRole: 'ops'
  })

  if (status === 'approved' && application) {
    const publicTrustLevel = trustLevel === 'trusted' ? 'trusted' : trustLevel === 'standard' ? 'standard' : 'basic'

    const trustSummary = buildManagerTrustSummary({
      certifications: Array.isArray(application.certifications) ? application.certifications : [],
      regions: Array.isArray(application.available_regions) ? application.available_regions : [],
      specialties: Array.isArray(application.specialties) ? application.specialties : [],
      vehicleOwned: Boolean(application.vehicle_owned),
      directTransportIncluded: false
    })

    const profileInsert = await rest('care_manager_profiles?on_conflict=application_id', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify([
        {
          application_id: application.id,
          manager_name: application.applicant_name,
          manager_phone: application.applicant_phone,
          profile_status: 'active',
          trust_level: publicTrustLevel,
          certifications: application.certifications || [],
          available_regions: application.available_regions || [],
          specialties: application.specialties || [],
          service_scopes: application.service_scopes || [],
          vehicle_owned: Boolean(application.vehicle_owned),
          driving_license_owned: Boolean(application.driving_license_owned),
          direct_transport_included: false,
          trust_card_summary: trustSummary,
          public_notes: '차량 보유 여부는 참고 정보이며, 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.',
          approved_at: new Date().toISOString()
        }
      ])
    })

    const profile = profileInsert.ok && Array.isArray(profileInsert.data) ? profileInsert.data[0] : null

    await insertEvent({
      applicationId: id,
      profileId: profile?.id || null,
      eventType: 'profile_created',
      title: '매니저 신뢰카드 생성',
      description: trustSummary,
      actorRole: 'system'
    })
  }

  return NextResponse.json({
    ok: true,
    application
  })
}
