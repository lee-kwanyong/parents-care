import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { demoAccounts } from '@/lib/demo-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type SafeResult = {
  label: string
  ok: boolean
  data?: any
  error?: any
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isAllowedSeed(secret: string) {
  if (process.env.NODE_ENV !== 'production') return true

  const expected = process.env.DEMO_SEED_SECRET || process.env.CRON_SECRET || ''

  if (!expected) return false

  return secret === expected
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase service env is missing' }
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

async function safeRest(label: string, path: string, init?: RequestInit): Promise<SafeResult> {
  const result = await rest(path, init)

  return {
    label,
    ok: result.ok,
    data: result.data,
    error: result.error
  }
}

async function authAdmin(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey() || anonKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase auth env is missing' }
  }

  const response = await fetch(base + '/auth/v1/' + path, {
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

async function findAuthUserByEmail(email: string) {
  const list = await authAdmin('admin/users?per_page=1000')

  if (!list.ok) return null

  const users = Array.isArray(list.data?.users)
    ? list.data.users
    : Array.isArray(list.data)
      ? list.data
      : []

  return users.find((user: any) => String(user.email || '').toLowerCase() === email.toLowerCase()) || null
}

async function ensureDemoAuthUser(input: {
  email: string
  password: string
  role: string
  displayName: string
}) {
  const existing = await findAuthUserByEmail(input.email)

  if (existing?.id) {
    return { ok: true, user: existing, created: false }
  }

  const created = await authAdmin('admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        display_name: input.displayName,
        user_role: input.role
      }
    })
  })

  if (!created.ok) {
    return { ok: false, user: null, created: false, error: created.error }
  }

  return { ok: true, user: created.data, created: true }
}

async function upsertDemoProfile(user: any, input: {
  role: string
  displayName: string
  phone: string
  method: string
}) {
  if (!user?.id) return { ok: false, error: 'missing user id' }

  return rest('care_auth_profiles?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify([
      {
        user_id: user.id,
        display_name: input.displayName,
        phone: input.phone,
        email: user.email || null,
        preferred_login_method: input.method,
        user_role: input.role,
        onboarding_status: 'completed',
        easy_mode: true,
        last_login_at: new Date().toISOString()
      }
    ])
  })
}

function firstRow(result: SafeResult) {
  return Array.isArray(result.data) ? result.data[0] : result.data
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const secret = text(body.secret)

  if (!isAllowedSeed(secret)) {
    return NextResponse.json(
      {
        ok: false,
        message: '데모 데이터 생성 권한이 없습니다. DEMO_SEED_SECRET 또는 CRON_SECRET을 입력하세요.'
      },
      { status: 401 }
    )
  }

  const runLabel = text(body.runLabel) || '부모님 걱정해결 케어 데모'
  const results: SafeResult[] = []
  const createdObjects: Record<string, any> = {}
  const failedObjects: SafeResult[] = []

  const seedRun = await safeRest('demo seed run started', 'care_demo_seed_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        run_label: runLabel,
        seed_status: 'started',
        summary: '데모 데이터 생성을 시작했습니다.',
        created_by: 'demo-start'
      }
    ])
  })

  results.push(seedRun)
  const seedRunId = firstRow(seedRun)?.id || null

  const userResults = []

  for (const account of demoAccounts) {
    const user = await ensureDemoAuthUser({
      email: account.email,
      password: account.password,
      role: account.role,
      displayName: account.label
    })

    userResults.push({
      email: account.email,
      role: account.role,
      ok: user.ok,
      created: user.created,
      id: user.user?.id || null,
      error: user.error || null
    })

    if (user.ok && user.user) {
      await upsertDemoProfile(user.user, {
        role: account.role,
        displayName: account.label,
        phone: account.role === 'guardian' ? '+821011112222' : account.role === 'manager' ? '+821033334444' : '+821055556666',
        method: 'email_password'
      })
    }
  }

  createdObjects.demoUsers = userResults

  const intake = await safeRest('assisted intake demo', 'care_assisted_intake_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: '어머니',
        contact_name: '보호자 데모',
        contact_phone: '010-1111-2222',
        channel: 'kakao',
        raw_text: '[데모] 어머니가 5월 10일 오전 10시 정형외과 예약이 있습니다. 오른쪽 다리가 불편하고 약 봉투 사진을 보낼 예정입니다.',
        summary_title: '어머니 정형외과 병원동행 데모 접수',
        status: 'received',
        priority: 'high',
        social_care_requested: false
      }
    ])
  })

  results.push(intake)
  createdObjects.intakeRequest = firstRow(intake)

  const storageFile = await safeRest('storage metadata demo', 'care_storage_files', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: '어머니',
        linked_module: 'assisted_intake',
        file_kind: 'text',
        bucket_id: 'care-files',
        storage_path: 'demo/appointment-message.txt',
        file_name: 'appointment-message.txt',
        file_label: '예약 문자 데모',
        mime_type: 'text/plain',
        size_bytes: 128,
        uploaded_by_role: 'family',
        uploaded_by_name: '보호자 데모',
        uploaded_by_phone: '010-1111-2222',
        status: 'active',
        memo: '실제 데모에서는 약 봉투, 영수증, 예약 문자 캡처를 업로드합니다.'
      }
    ])
  })

  results.push(storageFile)
  createdObjects.demoFile = firstRow(storageFile)

  const passport = await safeRest('care passport demo', 'care_passports', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: '어머니',
        hearing_attention: true,
        mobility_attention: true,
        allergy_status: 'yes',
        has_medications: true,
        fall_risk_level: 'medium',
        body_conditions: [
          {
            code: 'right_ear',
            label: '오른쪽 귀가 잘 안 들려요',
            managerTip: '왼쪽에서 천천히 설명하세요.'
          },
          {
            code: 'right_leg',
            label: '오른쪽 다리가 아프세요',
            managerTip: '오른쪽 다리 보행과 계단 이동을 주의하세요.'
          }
        ],
        allergies: [
          {
            memo: '조영제 알러지 여부 확인 필요',
            status: 'yes'
          }
        ],
        medications: [
          {
            memo: '혈압약, 무릎 통증약 복용 중'
          }
        ],
        diet_needs: [
          {
            label: '딱딱한 음식은 어려움'
          }
        ],
        communication_notes: '천천히 설명드리면 잘 이해하십니다.',
        emergency_notes: '어지러움 호소 시 보호자에게 즉시 연락'
      }
    ])
  })

  results.push(passport)
  createdObjects.carePassport = firstRow(passport)

  const managerApplication = await safeRest('manager application demo', 'care_manager_applications', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        applicant_name: '김하나 매니저',
        applicant_phone: '010-3333-4444',
        birth_year: 1978,
        address_text: '서울 강남구',
        preferred_contact: 'phone',
        application_status: 'submitted',
        manager_type: 'hospital_companion',
        certifications: ['요양보호사', '병원동행매니저 교육 수료', '심폐소생술 교육 이수'],
        career_years: 3,
        career_summary: '정형외과, 건강검진, 약국 동행 경험이 있습니다.',
        available_regions: ['강남구', '서초구', '송파구'],
        available_days: ['월', '화', '수', '목', '금'],
        available_time_slots: ['오전', '오후'],
        specialties: ['정형외과', '약국·복약 확인', '청력·의사소통 보조'],
        service_scopes: ['병원 앞 만남', '접수·수납 도움', '진료실 동행', '약국 동행', '복약 확인', '귀가 확인'],
        digital_skills: ['스마트폰 문자 가능', '카카오톡 가능', '지도앱 사용 가능', '사진 촬영·업로드 가능', '앱에서 상태 업데이트 가능'],
        vehicle_owned: true,
        driving_license_owned: true,
        understands_transport_policy: true,
        direct_transport_included: false,
        cpr_certified: true,
        background_check_consent: true,
        privacy_agreement: true,
        service_policy_agreement: true,
        intro_text: '부모님을 모시는 마음으로 차분하게 동행하겠습니다.',
        motivation_text: '어르신 병원동행과 진료 안내 경험을 살리고 싶습니다.',
        trust_level: 'review'
      }
    ])
  })

  results.push(managerApplication)
  const application = firstRow(managerApplication)
  createdObjects.managerApplication = application

  if (application?.id) {
    const verificationRows = [
      {
        manager_application_id: application.id,
        applicant_name: '김하나 매니저',
        applicant_phone: '010-3333-4444',
        verification_type: 'phone_identity',
        provider: 'ops',
        verification_status: 'verified',
        result_label: '휴대폰 본인확인 완료',
        reviewer_name: '운영실',
        reviewer_role: 'ops',
        verified_at: new Date().toISOString(),
        ops_memo: '데모 검증'
      },
      {
        manager_application_id: application.id,
        applicant_name: '김하나 매니저',
        applicant_phone: '010-3333-4444',
        verification_type: 'id_document',
        provider: 'ops',
        verification_status: 'verified',
        result_label: '신분 확인 완료',
        reviewer_name: '운영실',
        reviewer_role: 'ops',
        verified_at: new Date().toISOString(),
        ops_memo: '신분증 원본 저장 없이 확인 결과만 기록'
      },
      {
        manager_application_id: application.id,
        applicant_name: '김하나 매니저',
        applicant_phone: '010-3333-4444',
        verification_type: 'transport_policy',
        provider: 'ops',
        verification_status: 'verified',
        result_label: '차량·이동 정책 확인 완료',
        reviewer_name: '운영실',
        reviewer_role: 'ops',
        verified_at: new Date().toISOString(),
        ops_memo: '개인차량 직접 유상운송 미포함'
      },
      {
        manager_application_id: application.id,
        applicant_name: '김하나 매니저',
        applicant_phone: '010-3333-4444',
        verification_type: 'interview',
        provider: 'ops',
        verification_status: 'verified',
        result_label: '운영실 면접 확인 완료',
        reviewer_name: '운영실',
        reviewer_role: 'ops',
        verified_at: new Date().toISOString(),
        ops_memo: '말투, 태도, 현장 응대 기준 확인'
      }
    ]

    const verifications = await safeRest('manager identity verifications demo', 'care_manager_identity_verifications', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(verificationRows)
    })

    results.push(verifications)
    createdObjects.managerVerifications = verifications.data

    const approveApplication = await safeRest('manager application approve demo', 'care_manager_applications?id=eq.' + encodeURIComponent(application.id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        application_status: 'approved',
        identity_verification_status: 'verified',
        identity_verified_at: new Date().toISOString(),
        matching_eligible: true,
        trust_level: 'standard',
        review_score: 88,
        approved_at: new Date().toISOString(),
        ops_memo: '데모 승인 완료'
      })
    })

    results.push(approveApplication)

    const managerProfile = await safeRest('manager profile demo', 'care_manager_profiles?on_conflict=application_id', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify([
        {
          application_id: application.id,
          manager_name: '김하나 매니저',
          manager_phone: '010-3333-4444',
          profile_status: 'active',
          trust_level: 'standard',
          identity_verified: true,
          identity_verified_at: new Date().toISOString(),
          certifications: ['요양보호사', '병원동행매니저 교육 수료', '심폐소생술 교육 이수'],
          available_regions: ['강남구', '서초구', '송파구'],
          specialties: ['정형외과', '약국·복약 확인', '청력·의사소통 보조'],
          service_scopes: ['병원 앞 만남', '접수·수납 도움', '진료실 동행', '약국 동행', '복약 확인', '귀가 확인'],
          vehicle_owned: true,
          driving_license_owned: true,
          direct_transport_included: false,
          trust_card_summary: '요양보호사 · 병원동행 교육 수료 · 강남/서초/송파 가능 · 정형외과/약국 동행 경험',
          public_notes: '차량 보유 여부는 참고 정보이며, 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.',
          completed_cases: 12,
          rating_safety: 4.8,
          rating_kindness: 4.9,
          rating_accuracy: 4.7,
          rating_punctuality: 4.8,
          evaluation_count: 6,
          review_summary: '평가 6건 · 안전 4.8 · 친절 4.9 · 정확성 4.7 · 시간준수 4.8'
        }
      ])
    })

    results.push(managerProfile)
    const profile = firstRow(managerProfile)
    createdObjects.managerProfile = profile

    if (profile?.id) {
      const matchingRequest = await safeRest('manager matching request demo', 'care_manager_matching_requests', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify([
          {
            elder_name: '어머니',
            guardian_name: '보호자 데모',
            guardian_phone: '010-1111-2222',
            request_title: '어머니 정형외과 병원동행 데모',
            request_type: 'hospital_visit',
            region_text: '서울 강남구',
            hospital_name: '강남안심병원',
            appointment_date: '2026-05-10',
            appointment_time: '오전 10시',
            meeting_location: '병원 정문',
            required_specialties: ['정형외과', '약국·복약 확인', '청력·의사소통 보조'],
            required_service_scopes: ['병원 앞 만남', '접수·수납 도움', '진료실 동행', '약국 동행', '복약 확인', '귀가 확인'],
            mobility_support_needed: true,
            hearing_support_needed: true,
            allergy_attention_needed: true,
            medication_attention_needed: true,
            transport_mode: 'hospital_meet',
            vehicle_required: false,
            direct_transport_required: false,
            priority: 'high',
            matching_status: 'matched',
            selected_manager_profile_id: profile.id,
            ops_memo: '데모 매칭 요청'
          }
        ])
      })

      results.push(matchingRequest)
      const requestRow = firstRow(matchingRequest)
      createdObjects.matchingRequest = requestRow

      if (requestRow?.id) {
        const candidate = await safeRest('manager matching candidate demo', 'care_manager_matching_candidates', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify([
            {
              matching_request_id: requestRow.id,
              manager_profile_id: profile.id,
              match_score: 92,
              score_reasons: ['본인확인 완료', '가능지역 일치', '전문분야 일치', '복약·약국 확인 가능'],
              candidate_status: 'selected',
              ops_memo: '데모 추천 후보'
            }
          ])
        })

        results.push(candidate)
        createdObjects.matchingCandidate = firstRow(candidate)

        const assignment = await safeRest('manager field assignment demo', 'manager_field_assignments', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify([
            {
              matching_request_id: requestRow.id,
              manager_profile_id: profile.id,
              elder_name: '어머니',
              manager_name: '김하나 매니저',
              manager_phone: '010-3333-4444',
              assignment_type: 'hospital_visit',
              title: '어머니 정형외과 병원동행 데모',
              appointment_date: '2026-05-10',
              appointment_time: '오전 10시',
              meeting_location: '병원 정문',
              meeting_code: '2580',
              transport_mode: 'hospital_meet',
              vehicle_owned: true,
              direct_transport_included: false,
              transport_policy_acknowledged: true,
              status: 'assigned',
              care_passport_snapshot: {
                hearing: '오른쪽 귀가 잘 안 들림',
                mobility: '오른쪽 다리 보행 주의',
                allergy: '조영제 알러지 확인 필요',
                medication: '혈압약, 무릎 통증약 복용 중'
              },
              safety_notes: ['왼쪽에서 천천히 설명하세요.', '오른쪽 다리 보행과 계단 이동을 주의하세요.', '약·음식·검사 전 알러지 확인'],
              guardian_questions: ['진료 후 다음 외래 날짜 확인', '약 복용 시간 확인'],
              required_documents: ['진료비 영수증', '처방전', '세부내역서'],
              ops_memo: '데모 현장 배정',
              created_by_role: 'ops',
              manager_trust_snapshot: {
                manager_profile_id: profile.id,
                trust_level: 'standard',
                identity_verified: true,
                trust_card_summary: '검증 완료 매니저',
                rating_safety: 4.8,
                rating_kindness: 4.9,
                rating_accuracy: 4.7,
                rating_punctuality: 4.8
              },
              matching_gate_checked: true
            }
          ])
        })

        results.push(assignment)
        const assignmentRow = firstRow(assignment)
        createdObjects.managerAssignment = assignmentRow

        if (assignmentRow?.id) {
          const checklist = await safeRest('manager checklist demo', 'manager_field_checklist_items', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify([
              {
                assignment_id: assignmentRow.id,
                title: '만남 암호 확인',
                description: '부모님께 만남 암호 2580을 안내하고 확인합니다.',
                priority: 'urgent',
                status: 'pending',
                sort_order: 10
              },
              {
                assignment_id: assignmentRow.id,
                title: '알러지와 복용약 확인',
                description: '진료 전 알러지와 복용약 정보를 보호자와 확인합니다.',
                priority: 'high',
                status: 'pending',
                sort_order: 20
              },
              {
                assignment_id: assignmentRow.id,
                title: '영수증·처방전 챙김',
                description: '진료 후 영수증, 처방전, 세부내역서를 확인합니다.',
                priority: 'normal',
                status: 'pending',
                sort_order: 30
              }
            ])
          })

          results.push(checklist)

          const report = await safeRest('manager report demo', 'manager_field_reports', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify([
              {
                assignment_id: assignmentRow.id,
                visit_summary: '정형외과 진료와 약국 방문을 완료했습니다.',
                doctor_guidance: '무릎 통증 관련 약 복용과 다음 외래 확인이 필요합니다.',
                medication_summary: '혈압약과 무릎 통증약 복용 시간을 보호자에게 공유했습니다.',
                document_summary: '영수증, 처방전, 세부내역서를 챙겼습니다.',
                meal_condition_summary: '딱딱한 음식은 피하고 부드러운 식사를 권장합니다.',
                parent_condition: '컨디션은 전반적으로 안정적이나 계단 이동 시 주의가 필요합니다.',
                family_next_actions: ['다음 외래 예약 확인', '약 복용 시간 확인', '영수증 사진 보관'],
                reassurance_state: '확인 필요',
                status: 'draft'
              }
            ])
          })

          results.push(report)
          createdObjects.managerReport = firstRow(report)
        }

        const updateRequest = await safeRest('matching request assigned demo', 'care_manager_matching_requests?id=eq.' + encodeURIComponent(requestRow.id), {
          method: 'PATCH',
          body: JSON.stringify({
            matching_status: 'assigned',
            manager_assignment_id: assignmentRow?.id || null,
            updated_at: new Date().toISOString()
          })
        })

        results.push(updateRequest)
      }

      const evaluation = await safeRest('manager evaluation demo', 'care_manager_evaluations', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify([
          {
            manager_profile_id: profile.id,
            elder_name: '어머니',
            evaluator_name: '보호자 데모',
            evaluator_phone: '010-1111-2222',
            rating_safety: 5,
            rating_kindness: 5,
            rating_accuracy: 5,
            rating_punctuality: 5,
            would_request_again: true,
            public_comment: '천천히 설명해주시고 약국과 서류까지 잘 챙겨주셨습니다.',
            private_comment: '데모 평가',
            evaluation_status: 'submitted',
            created_by_role: 'family'
          }
        ])
      })

      results.push(evaluation)
      createdObjects.managerEvaluation = firstRow(evaluation)
    }
  }

  const notification = await safeRest('notification demo', 'notification_outbox', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: '어머니',
        recipient_role: 'guardian',
        recipient_name: '보호자 데모',
        recipient_phone: '010-1111-2222',
        channel: 'app',
        template_code: 'summary_30sec_ready',
        title: '30초 요약 도착',
        body: '어머니 병원동행 데모 요약이 준비됐습니다.',
        payload: {
          source_type: 'demo',
          url: '/child/cases'
        },
        priority: 'normal',
        status: 'queued',
        created_by_role: 'system',
        dedupe_key: 'demo-summary-' + randomUUID()
      }
    ])
  })

  results.push(notification)
  createdObjects.notification = firstRow(notification)

  const failed = results.filter((item) => !item.ok)
  failedObjects.push(...failed)

  if (seedRunId) {
    await rest('care_demo_seed_runs?id=eq.' + encodeURIComponent(seedRunId), {
      method: 'PATCH',
      body: JSON.stringify({
        seed_status: failed.length === 0 ? 'completed' : 'partial',
        summary: failed.length === 0
          ? '데모 데이터 생성이 완료됐습니다.'
          : `일부 데모 데이터 생성에 실패했습니다. 실패 ${failed.length}건`,
        created_objects: createdObjects,
        failed_objects: failedObjects
      })
    })
  }

  return NextResponse.json({
    ok: failed.length === 0,
    status: failed.length === 0 ? 'completed' : 'partial',
    message: failed.length === 0
      ? '데모 데이터 생성이 완료됐습니다.'
      : `일부 데이터는 생성됐지만 ${failed.length}건은 실패했습니다. 실패 항목은 화면에서 확인하세요.`,
    createdObjects,
    results
  })
}
