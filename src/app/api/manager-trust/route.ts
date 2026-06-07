import { NextRequest, NextResponse } from 'next/server'
import {
  type ManagerVerificationProvider,
  type ManagerVerificationStatus,
  type ManagerVerificationType
} from '@/lib/manager-trust-engine'

export const dynamic = 'force-dynamic'

const allowedVerificationTypes = new Set([
  'phone_identity',
  'id_document',
  'certificate_check',
  'career_check',
  'background_consent',
  'interview',
  'training',
  'cpr_training',
  'transport_policy',
  'digital_skill',
  'ops_reference'
])

const allowedProviders = new Set(['ops', 'nice', 'kcb', 'kakao', 'manual', 'partner'])
const allowedVerificationStatuses = new Set(['pending', 'verified', 'failed', 'waived', 'expired'])
const allowedEvaluationStatuses = new Set(['submitted', 'ops_reviewed', 'hidden', 'deleted'])

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

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 'on'
}

function clampRating(value: unknown) {
  const rating = Math.round(numberValue(value, 5))
  return Math.min(5, Math.max(1, rating))
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

async function fetchApplication(id: string) {
  const result = await rest(
    'care_manager_applications?select=' +
      encodeURIComponent('id,applicant_name,applicant_phone') +
      '&id=eq.' +
      encodeURIComponent(id) +
      '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data)) return null
  return result.data[0] || null
}

export async function GET() {
  const applicationSelect = [
    'id',
    'applicant_name',
    'applicant_phone',
    'application_status',
    'identity_verification_status',
    'matching_eligible',
    'vehicle_owned',
    'direct_transport_included',
    'understands_transport_policy',
    'privacy_agreement',
    'service_policy_agreement',
    'background_check_consent',
    'trust_level',
    'created_at'
  ].join(',')

  const profileSelect = [
    'id',
    'application_id',
    'manager_name',
    'manager_phone',
    'profile_status',
    'trust_level',
    'identity_verified',
    'identity_verified_at',
    'vehicle_owned',
    'direct_transport_included',
    'trust_card_summary',
    'public_notes',
    'completed_cases',
    'evaluation_count',
    'rating_safety',
    'rating_kindness',
    'rating_accuracy',
    'rating_punctuality',
    'review_summary',
    'created_at'
  ].join(',')

  const verificationSelect = [
    'id',
    'manager_application_id',
    'manager_profile_id',
    'applicant_name',
    'applicant_phone',
    'verification_type',
    'provider',
    'verification_status',
    'result_label',
    'provider_reference',
    'reviewer_name',
    'reviewer_role',
    'verified_at',
    'expires_at',
    'ops_memo',
    'created_at',
    'updated_at'
  ].join(',')

  const evaluationSelect = [
    'id',
    'manager_profile_id',
    'manager_assignment_id',
    'elder_name',
    'evaluator_name',
    'evaluator_phone',
    'rating_safety',
    'rating_kindness',
    'rating_accuracy',
    'rating_punctuality',
    'would_request_again',
    'public_comment',
    'private_comment',
    'evaluation_status',
    'created_by_role',
    'reviewed_at',
    'created_at',
    'updated_at'
  ].join(',')

  const [applications, profiles, verifications, evaluations] = await Promise.all([
    rest('care_manager_applications?select=' + encodeURIComponent(applicationSelect) + '&order=created_at.desc&limit=200'),
    rest('care_manager_profiles?select=' + encodeURIComponent(profileSelect) + '&order=created_at.desc&limit=200'),
    rest('care_manager_identity_verifications?select=' + encodeURIComponent(verificationSelect) + '&order=created_at.desc&limit=500'),
    rest('care_manager_evaluations?select=' + encodeURIComponent(evaluationSelect) + '&order=created_at.desc&limit=500')
  ])

  if (!applications.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '매니저 검증 정보를 불러오지 못했습니다. SQL이 실행됐는지 확인해주세요.',
        detail: applications.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    applications: Array.isArray(applications.data) ? applications.data : [],
    profiles: profiles.ok && Array.isArray(profiles.data) ? profiles.data : [],
    verifications: verifications.ok && Array.isArray(verifications.data) ? verifications.data : [],
    evaluations: evaluations.ok && Array.isArray(evaluations.data) ? evaluations.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'create_verification'

  if (action === 'create_verification') {
    const applicationId = text(body.applicationId)
    const verificationTypeValue = text(body.verificationType) || 'phone_identity'
    const providerValue = text(body.provider) || 'ops'
    const statusValue = text(body.status) || 'verified'

    if (!applicationId) {
      return NextResponse.json({ ok: false, message: '지원서 ID가 필요합니다.' }, { status: 400 })
    }

    if (!allowedVerificationTypes.has(verificationTypeValue)) {
      return NextResponse.json({ ok: false, message: 'verificationType이 올바르지 않습니다.' }, { status: 400 })
    }

    if (!allowedProviders.has(providerValue)) {
      return NextResponse.json({ ok: false, message: 'provider가 올바르지 않습니다.' }, { status: 400 })
    }

    if (!allowedVerificationStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
    }

    const application = await fetchApplication(applicationId)

    if (!application) {
      return NextResponse.json({ ok: false, message: '지원서를 찾지 못했습니다.' }, { status: 404 })
    }

    const verificationType = verificationTypeValue as ManagerVerificationType
    const provider = providerValue as ManagerVerificationProvider
    const status = statusValue as ManagerVerificationStatus

    const insert = await rest('care_manager_identity_verifications', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          manager_application_id: applicationId,
          applicant_name: application.applicant_name,
          applicant_phone: application.applicant_phone,
          verification_type: verificationType,
          provider,
          verification_status: status,
          result_label: text(body.resultLabel) || null,
          provider_reference: text(body.providerReference) || null,
          reviewer_name: text(body.reviewerName) || '운영실',
          reviewer_role: 'ops',
          verified_at: status === 'verified' ? new Date().toISOString() : null,
          expires_at: text(body.expiresAt) || null,
          ops_memo: text(body.opsMemo) || null
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '검증 기록 저장 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      verification: Array.isArray(insert.data) ? insert.data[0] : insert.data
    })
  }

  if (action === 'create_evaluation') {
    const profileId = text(body.profileId)

    if (!profileId) {
      return NextResponse.json({ ok: false, message: '매니저 프로필 ID가 필요합니다.' }, { status: 400 })
    }

    const insert = await rest('care_manager_evaluations', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          manager_profile_id: profileId,
          manager_assignment_id: text(body.assignmentId) || null,
          elder_name: text(body.elderName) || '부모님',
          evaluator_name: text(body.evaluatorName) || null,
          evaluator_phone: text(body.evaluatorPhone) || null,
          rating_safety: clampRating(body.ratingSafety),
          rating_kindness: clampRating(body.ratingKindness),
          rating_accuracy: clampRating(body.ratingAccuracy),
          rating_punctuality: clampRating(body.ratingPunctuality),
          would_request_again: bool(body.wouldRequestAgain),
          public_comment: text(body.publicComment) || null,
          private_comment: text(body.privateComment) || null,
          evaluation_status: 'submitted',
          created_by_role: 'family'
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '매니저 평가 저장 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      evaluation: Array.isArray(insert.data) ? insert.data[0] : insert.data
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const kind = text(body.kind)
  const id = text(body.id)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (kind === 'verification') {
    const statusValue = text(body.status)

    if (!allowedVerificationStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
    }

    const patch: Record<string, unknown> = {
      verification_status: statusValue,
      updated_at: new Date().toISOString()
    }

    if (statusValue === 'verified') patch.verified_at = new Date().toISOString()
    if (text(body.opsMemo)) patch.ops_memo = text(body.opsMemo)

    const result = await rest('care_manager_identity_verifications?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '검증 상태 변경 실패',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      item: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (kind === 'evaluation') {
    const statusValue = text(body.status)

    if (!allowedEvaluationStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'evaluation status가 올바르지 않습니다.' }, { status: 400 })
    }

    const patch: Record<string, unknown> = {
      evaluation_status: statusValue,
      updated_at: new Date().toISOString()
    }

    if (statusValue === 'ops_reviewed') patch.reviewed_at = new Date().toISOString()

    const result = await rest('care_manager_evaluations?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '평가 상태 변경 실패',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      item: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  return NextResponse.json({ ok: false, message: 'kind가 올바르지 않습니다.' }, { status: 400 })
}
