import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null as any,
      error: 'Supabase 환경변수가 없습니다.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    status: response.status,
    data: parsed,
    error: null
  }
}

async function storageUpload(input: {
  path: string
  file: File
}) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      error: 'Supabase Storage 환경변수가 없습니다.'
    }
  }

  const arrayBuffer = await input.file.arrayBuffer()
  const uploadUrl = base + '/storage/v1/object/care-files/' + encodeURI(input.path)

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': input.file.type || 'application/octet-stream',
      'x-upsert': 'true'
    },
    body: new Blob([arrayBuffer], {
      type: input.file.type || 'application/octet-stream'
    })
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return {
      ok: false,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    data: parsed
  }
}

function firstRow(result: { data: any }) {
  return Array.isArray(result.data) ? result.data[0] : result.data
}

async function createEvent(input: {
  managerApplicationId?: string | null
  managerProfileId?: string | null
  requirementCode?: string | null
  documentId?: string | null
  eventType: string
  title: string
  description?: string | null
  payload?: Record<string, unknown>
  createdByName?: string | null
  createdByRole?: string
}) {
  await rest('care_manager_vetting_events', {
    method: 'POST',
    body: JSON.stringify([
      {
        manager_application_id: input.managerApplicationId || null,
        manager_profile_id: input.managerProfileId || null,
        requirement_code: input.requirementCode || null,
        document_id: input.documentId || null,
        event_type: input.eventType,
        title: input.title,
        description: input.description || null,
        payload: input.payload || {},
        created_by_name: input.createdByName || null,
        created_by_role: input.createdByRole || 'ops'
      }
    ])
  })
}

async function fetchRequirements() {
  const result = await rest(
    'care_manager_verification_requirements?select=*&active=eq.true&order=sort_order.asc'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function fetchApplication(id: string) {
  const result = await rest(
    'care_manager_applications?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1'
  )

  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

async function fetchDocumentsForApplication(id: string) {
  const result = await rest(
    'care_manager_verification_documents?select=*&manager_application_id=eq.' +
      encodeURIComponent(id) +
      '&order=created_at.desc'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

function getReadiness(requirements: AnyRow[], documents: AnyRow[]) {
  const required = requirements.filter((item) => item.is_required)
  const verifiedCodes = new Set(
    documents
      .filter((doc) => doc.verification_status === 'verified')
      .map((doc) => doc.requirement_code)
  )

  const missing = required
    .filter((req) => !verifiedCodes.has(req.code))
    .map((req) => req.code)

  return {
    requiredTotal: required.length,
    requiredVerified: required.length - missing.length,
    missing,
    ready: missing.length === 0
  }
}

export async function GET() {
  const [requirements, applications, documents, board] = await Promise.all([
    rest('care_manager_verification_requirements?select=*&active=eq.true&order=sort_order.asc'),
    rest('care_manager_applications?select=*&order=created_at.desc&limit=200'),
    rest('care_manager_verification_documents?select=*&order=created_at.desc&limit=500'),
    rest('ops_manager_vetting_board?select=*&limit=200')
  ])

  return NextResponse.json({
    ok: true,
    requirements: requirements.ok && Array.isArray(requirements.data) ? requirements.data : [],
    applications: applications.ok && Array.isArray(applications.data) ? applications.data : [],
    documents: documents.ok && Array.isArray(documents.data) ? documents.data : [],
    board: board.ok && Array.isArray(board.data) ? board.data : [],
    errors: {
      requirements: requirements.ok ? null : requirements.error,
      applications: applications.ok ? null : applications.error,
      documents: documents.ok ? null : documents.error,
      board: board.ok ? null : board.error
    }
  })
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()

    const action = text(formData.get('action'))
    const managerApplicationId = text(formData.get('managerApplicationId'))
    const requirementCode = text(formData.get('requirementCode'))
    const documentTitle = text(formData.get('documentTitle')) || requirementCode
    const documentMemo = text(formData.get('documentMemo'))
    const submittedByName = text(formData.get('submittedByName')) || '매니저'
    const submittedByRole = text(formData.get('submittedByRole')) || 'manager'
    const fileValue = formData.get('file')

    if (action !== 'upload_document') {
      return NextResponse.json({ ok: false, message: 'multipart action이 올바르지 않습니다.' }, { status: 400 })
    }

    if (!managerApplicationId || !requirementCode) {
      return NextResponse.json({ ok: false, message: 'managerApplicationId와 requirementCode가 필요합니다.' }, { status: 400 })
    }

    let storagePath: string | null = null
    let fileName: string | null = null
    let mimeType: string | null = null
    let sizeBytes = 0

    if (fileValue instanceof File && fileValue.size > 0) {
      const safeFileName = fileValue.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
      storagePath = `manager-vetting/${managerApplicationId}/${Date.now()}-${safeFileName}`
      fileName = fileValue.name
      mimeType = fileValue.type || 'application/octet-stream'
      sizeBytes = fileValue.size

      const upload = await storageUpload({
        path: storagePath,
        file: fileValue
      })

      if (!upload.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: '서류 파일 업로드 중 오류가 발생했습니다.',
            detail: upload.error
          },
          { status: 500 }
        )
      }
    }

    const insert = await rest('care_manager_verification_documents', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          manager_application_id: managerApplicationId,
          requirement_code: requirementCode,
          document_title: documentTitle,
          document_memo: documentMemo || null,
          storage_bucket: 'care-files',
          storage_path: storagePath,
          file_name: fileName,
          mime_type: mimeType,
          size_bytes: sizeBytes,
          submitted_by_name: submittedByName,
          submitted_by_role: submittedByRole,
          verification_status: 'submitted'
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '검증 서류 등록 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    const document = firstRow(insert)

    await rest('care_manager_applications?id=eq.' + encodeURIComponent(managerApplicationId), {
      method: 'PATCH',
      body: JSON.stringify({
        vetting_status: 'in_review',
        updated_at: new Date().toISOString()
      })
    })

    await createEvent({
      managerApplicationId,
      requirementCode,
      documentId: document?.id,
      eventType: 'document_submitted',
      title: '매니저 검증 서류가 등록됐습니다.',
      description: documentTitle,
      createdByName: submittedByName,
      createdByRole: submittedByRole
    })

    return NextResponse.json({
      ok: true,
      message: '검증 서류가 등록됐습니다.',
      document
    })
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create_demo_application') {
    const insert = await rest('care_manager_applications', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          applicant_name: text(body.applicantName) || '김하나 매니저',
          applicant_phone: text(body.applicantPhone) || '010-3333-4444',
          birth_year: 1978,
          address_text: '서울 강남구',
          preferred_contact: 'phone',
          application_status: 'submitted',
          manager_type: 'hospital_companion',
          certifications: ['요양보호사', '병원동행 교육'],
          career_years: 3,
          career_summary: '정형외과, 건강검진, 약국 동행 경험이 있습니다.',
          available_regions: ['강남구', '서초구', '송파구'],
          available_days: ['월', '화', '수', '목', '금'],
          available_time_slots: ['오전', '오후'],
          specialties: ['정형외과', '약국·복약 확인', '청력·의사소통 보조'],
          service_scopes: ['병원 앞 만남', '접수·수납 도움', '진료실 동행', '약국 동행', '복약 확인', '귀가 확인'],
          digital_skills: ['카카오톡 가능', '지도앱 사용 가능', '사진 촬영·업로드 가능'],
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
          vetting_status: 'not_started',
          trust_level: 'review'
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json({ ok: false, message: '데모 지원자 생성 실패', detail: insert.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: '데모 매니저 지원자가 생성됐습니다.',
      application: firstRow(insert)
    })
  }

  if (action === 'mark_verified' || action === 'mark_rejected') {
    const documentId = text(body.documentId)
    const reviewerName = text(body.reviewerName) || '운영실'
    const rejectedReason = text(body.rejectedReason)

    if (!documentId) {
      return NextResponse.json({ ok: false, message: 'documentId가 필요합니다.' }, { status: 400 })
    }

    const status = action === 'mark_verified' ? 'verified' : 'rejected'

    const patch = await rest('care_manager_verification_documents?id=eq.' + encodeURIComponent(documentId), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        verification_status: status,
        reviewed_by: reviewerName,
        reviewed_by_role: 'ops',
        reviewed_at: new Date().toISOString(),
        rejected_reason: status === 'rejected' ? rejectedReason || '운영실 반려' : null,
        updated_at: new Date().toISOString()
      })
    })

    if (!patch.ok) {
      return NextResponse.json({ ok: false, message: '서류 상태 변경 실패', detail: patch.error }, { status: 500 })
    }

    const document = firstRow(patch)

    await createEvent({
      managerApplicationId: document?.manager_application_id,
      requirementCode: document?.requirement_code,
      documentId: document?.id,
      eventType: status,
      title: status === 'verified' ? '검증 항목 확인 완료' : '검증 항목 반려',
      description: document?.document_title,
      createdByName: reviewerName,
      createdByRole: 'ops'
    })

    return NextResponse.json({
      ok: true,
      message: status === 'verified' ? '검증 완료로 표시했습니다.' : '반려 처리했습니다.',
      document
    })
  }

  if (action === 'approve_if_ready') {
    const managerApplicationId = text(body.managerApplicationId)
    const reviewerName = text(body.reviewerName) || '운영실'

    if (!managerApplicationId) {
      return NextResponse.json({ ok: false, message: 'managerApplicationId가 필요합니다.' }, { status: 400 })
    }

    const [requirements, documents, application] = await Promise.all([
      fetchRequirements(),
      fetchDocumentsForApplication(managerApplicationId),
      fetchApplication(managerApplicationId)
    ])

    if (!application) {
      return NextResponse.json({ ok: false, message: '매니저 지원서를 찾지 못했습니다.' }, { status: 404 })
    }

    const readiness = getReadiness(requirements, documents)

    if (!readiness.ready) {
      return NextResponse.json(
        {
          ok: false,
          message: '필수 검증 항목이 아직 완료되지 않았습니다.',
          missing: readiness.missing,
          requiredTotal: readiness.requiredTotal,
          requiredVerified: readiness.requiredVerified
        },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const applicationPatch = await rest('care_manager_applications?id=eq.' + encodeURIComponent(managerApplicationId), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        application_status: 'approved',
        vetting_status: 'approved',
        identity_verification_status: 'verified',
        identity_verified_at: now,
        matching_eligible: true,
        trust_level: 'standard',
        reviewed_at: now,
        approved_at: now,
        vetting_completed_at: now,
        updated_at: now
      })
    })

    if (!applicationPatch.ok) {
      return NextResponse.json({ ok: false, message: '지원서 승인 실패', detail: applicationPatch.error }, { status: 500 })
    }

    const approvedApplication = firstRow(applicationPatch)

    const verifiedRequirementTitles = requirements
      .filter((req) => readiness.missing.includes(req.code) === false)
      .map((req) => req.title)

    const profileUpsert = await rest('care_manager_profiles?on_conflict=application_id', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify([
        {
          application_id: managerApplicationId,
          manager_name: approvedApplication.applicant_name,
          manager_phone: approvedApplication.applicant_phone,
          profile_status: 'active',
          trust_level: 'standard',
          identity_verified: true,
          identity_verified_at: now,
          certifications: approvedApplication.certifications || verifiedRequirementTitles,
          available_regions: approvedApplication.available_regions || [],
          specialties: approvedApplication.specialties || [],
          service_scopes: approvedApplication.service_scopes || [],
          vehicle_owned: Boolean(approvedApplication.vehicle_owned),
          driving_license_owned: Boolean(approvedApplication.driving_license_owned),
          direct_transport_included: false,
          trust_card_summary: `${approvedApplication.applicant_name} · 최초 검증 완료 · ${verifiedRequirementTitles.slice(0, 3).join(' · ')}`,
          public_notes: '검증 완료 매니저입니다. 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.',
          completed_cases: 0,
          evaluation_count: 0,
          review_summary: '신규 검증 매니저',
          approved_at: now
        }
      ])
    })

    if (!profileUpsert.ok) {
      return NextResponse.json({ ok: false, message: '매니저 프로필 생성 실패', detail: profileUpsert.error }, { status: 500 })
    }

    const profile = firstRow(profileUpsert)

    await createEvent({
      managerApplicationId,
      managerProfileId: profile?.id,
      eventType: 'approved',
      title: '매니저 최초 검증 승인 완료',
      description: '검증 매니저 풀에 등록됐습니다.',
      createdByName: reviewerName,
      createdByRole: 'ops',
      payload: {
        verifiedRequirementTitles,
        requiredTotal: readiness.requiredTotal,
        requiredVerified: readiness.requiredVerified
      }
    })

    return NextResponse.json({
      ok: true,
      message: '검증 매니저로 승인하고 매니저 풀에 등록했습니다.',
      application: approvedApplication,
      profile
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}
