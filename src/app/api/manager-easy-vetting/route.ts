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

function bool(value: unknown) {
  return value === true || value === 'true' || value === 'on' || value === '1'
}

function arrayFrom(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }

  const str = text(value)
  if (!str) return []

  return str.split(',').map((item) => item.trim()).filter(Boolean)
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

async function uploadToStorage(input: {
  path: string
  file: File
}) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      error: 'Storage 환경변수가 없습니다.'
    }
  }

  const arrayBuffer = await input.file.arrayBuffer()

  const response = await fetch(base + '/storage/v1/object/care-files/' + encodeURI(input.path), {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': input.file.type || 'application/octet-stream',
      'x-upsert': 'true'
    },
    body: new Blob([arrayBuffer], { type: input.file.type || 'application/octet-stream' })
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

async function getRequirements() {
  const result = await rest('care_manager_verification_requirements?select=*&active=eq.true&order=sort_order.asc')
  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function getDocuments() {
  const result = await rest('care_manager_verification_documents?select=*&order=created_at.desc&limit=500')
  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function getApplications() {
  const result = await rest('care_manager_applications?select=*&order=created_at.desc&limit=200')
  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function getApplication(id: string) {
  const result = await rest('care_manager_applications?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

async function getDocumentsForApplication(id: string) {
  const result = await rest(
    'care_manager_verification_documents?select=*&manager_application_id=eq.' +
      encodeURIComponent(id) +
      '&order=created_at.desc'
  )
  return result.ok && Array.isArray(result.data) ? result.data : []
}

function readiness(requirements: AnyRow[], documents: AnyRow[]) {
  const required = requirements.filter((item) => item.is_required)
  const verifiedCodes = new Set(
    documents
      .filter((item) => item.verification_status === 'verified')
      .map((item) => item.requirement_code)
  )

  const missing = required.filter((item) => !verifiedCodes.has(item.code)).map((item) => item.code)

  return {
    total: required.length,
    verified: required.length - missing.length,
    missing,
    ready: missing.length === 0
  }
}

async function createDocument(input: {
  managerApplicationId: string
  requirementCode: string
  documentTitle: string
  documentMemo?: string | null
  status: string
  submittedByName?: string | null
  submittedByRole?: string
  storagePath?: string | null
  fileName?: string | null
  mimeType?: string | null
  sizeBytes?: number
  reviewedBy?: string | null
}) {
  const result = await rest('care_manager_verification_documents', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        manager_application_id: input.managerApplicationId,
        requirement_code: input.requirementCode,
        document_title: input.documentTitle,
        document_memo: input.documentMemo || null,
        storage_bucket: 'care-files',
        storage_path: input.storagePath || null,
        file_name: input.fileName || null,
        mime_type: input.mimeType || null,
        size_bytes: input.sizeBytes || 0,
        submitted_by_name: input.submittedByName || null,
        submitted_by_role: input.submittedByRole || 'manager',
        verification_status: input.status,
        reviewed_by: input.reviewedBy || null,
        reviewed_by_role: input.status === 'verified' ? 'ops' : 'ops',
        reviewed_at: input.status === 'verified' ? new Date().toISOString() : null
      }
    ])
  })

  return result
}

export async function GET() {
  const [requirements, applications, documents] = await Promise.all([
    getRequirements(),
    getApplications(),
    getDocuments()
  ])

  return NextResponse.json({
    ok: true,
    requirements,
    applications,
    documents
  })
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const action = text(formData.get('action'))

    if (action !== 'submit_document') {
      return NextResponse.json({ ok: false, message: '잘못된 요청입니다.' }, { status: 400 })
    }

    const managerApplicationId = text(formData.get('managerApplicationId'))
    const requirementCode = text(formData.get('requirementCode'))
    const documentTitle = text(formData.get('documentTitle')) || requirementCode
    const documentMemo = text(formData.get('documentMemo'))
    const submittedByName = text(formData.get('submittedByName')) || '매니저'
    const submittedByRole = text(formData.get('submittedByRole')) || 'manager'
    const fileValue = formData.get('file')

    if (!managerApplicationId || !requirementCode) {
      return NextResponse.json({ ok: false, message: '지원자와 검증 항목을 선택해주세요.' }, { status: 400 })
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

      const upload = await uploadToStorage({
        path: storagePath,
        file: fileValue
      })

      if (!upload.ok) {
        return NextResponse.json({ ok: false, message: '파일 업로드 실패', detail: upload.error }, { status: 500 })
      }
    }

    const insert = await createDocument({
      managerApplicationId,
      requirementCode,
      documentTitle,
      documentMemo,
      status: 'submitted',
      submittedByName,
      submittedByRole,
      storagePath,
      fileName,
      mimeType,
      sizeBytes
    })

    if (!insert.ok) {
      return NextResponse.json({ ok: false, message: '검증 자료 제출 실패', detail: insert.error }, { status: 500 })
    }

    await rest('care_manager_applications?id=eq.' + encodeURIComponent(managerApplicationId), {
      method: 'PATCH',
      body: JSON.stringify({
        vetting_status: 'in_review',
        updated_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      ok: true,
      message: '검증 자료가 제출됐습니다.',
      document: firstRow(insert)
    })
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create_application') {
    const applicantName = text(body.applicantName)
    const applicantPhone = text(body.applicantPhone)

    if (!applicantName || !applicantPhone) {
      return NextResponse.json({ ok: false, message: '이름과 연락처는 필수입니다.' }, { status: 400 })
    }

    const regions = arrayFrom(body.availableRegions)
    const specialties = arrayFrom(body.specialties)
    const serviceScopes = [
      '병원 앞 만남',
      '접수·수납 도움',
      '약국 동행',
      '복약 확인',
      '귀가 확인'
    ]

    const certifications: string[] = []
    if (bool(body.hasCareWorkerCertificate)) certifications.push('요양보호사 또는 관련 자격 보유')
    if (bool(body.hasHospitalTraining)) certifications.push('병원동행 교육 경험')
    if (bool(body.hasCprTraining)) certifications.push('응급상황 대응 교육 경험')

    const insert = await rest('care_manager_applications', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          applicant_name: applicantName,
          applicant_phone: applicantPhone,
          birth_year: Number(body.birthYear || 0) || null,
          address_text: text(body.addressText),
          preferred_contact: 'phone',
          application_status: 'submitted',
          manager_type: 'hospital_companion',
          certifications,
          career_years: Number(body.careerYears || 0) || 0,
          career_summary: text(body.careerSummary),
          available_regions: regions,
          available_days: arrayFrom(body.availableDays),
          available_time_slots: arrayFrom(body.availableTimeSlots),
          specialties,
          service_scopes: serviceScopes,
          digital_skills: ['전화 가능', '카카오톡 가능', '사진 제출 가능'],
          vehicle_owned: bool(body.vehicleOwned),
          driving_license_owned: bool(body.drivingLicenseOwned),
          understands_transport_policy: bool(body.understandsTransportPolicy),
          direct_transport_included: false,
          cpr_certified: bool(body.hasCprTraining),
          background_check_consent: bool(body.backgroundCheckConsent),
          privacy_agreement: bool(body.privacyAgreement),
          service_policy_agreement: bool(body.servicePolicyAgreement),
          intro_text: text(body.introText),
          motivation_text: text(body.motivationText),
          vetting_status: 'not_started',
          trust_level: 'review'
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json({ ok: false, message: '매니저 등록 실패', detail: insert.error }, { status: 500 })
    }

    const application = firstRow(insert)

    const autoConsentCodes = [
      ['privacy_consent', '개인정보·병원정보 취급 동의', bool(body.privacyAgreement)],
      ['medical_boundary_policy', '의료행위 금지 원칙 확인', bool(body.servicePolicyAgreement)],
      ['transport_policy', '이동·차량 정책 확인', bool(body.understandsTransportPolicy)],
      ['background_check_consent', '결격사유 확인 동의', bool(body.backgroundCheckConsent)]
    ] as const

    for (const [code, title, agreed] of autoConsentCodes) {
      if (agreed) {
        await createDocument({
          managerApplicationId: application.id,
          requirementCode: code,
          documentTitle: title,
          documentMemo: '간단 등록 과정에서 동의함',
          status: 'submitted',
          submittedByName: applicantName,
          submittedByRole: 'manager'
        })
      }
    }

    return NextResponse.json({
      ok: true,
      message: '매니저 간단 등록이 완료됐습니다. 이제 검증자료를 단계별로 제출하면 됩니다.',
      application
    })
  }

  if (action === 'create_demo_application') {
    const response = await fetch(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_application',
        applicantName: text(body.applicantName) || '김하나 매니저',
        applicantPhone: text(body.applicantPhone) || '01033334444',
        birthYear: 1978,
        addressText: '서울 강남구',
        availableRegions: ['강남구', '서초구', '송파구'],
        availableDays: ['월', '화', '수', '목', '금'],
        availableTimeSlots: ['오전', '오후'],
        specialties: ['정형외과', '약국·복약 확인', '청력·의사소통 보조'],
        careerYears: 3,
        careerSummary: '정형외과, 건강검진, 약국 동행 경험이 있습니다.',
        hasCareWorkerCertificate: true,
        hasHospitalTraining: true,
        hasCprTraining: true,
        vehicleOwned: true,
        drivingLicenseOwned: true,
        understandsTransportPolicy: true,
        privacyAgreement: true,
        servicePolicyAgreement: true,
        backgroundCheckConsent: true,
        introText: '부모님을 모시는 마음으로 차분하게 동행하겠습니다.',
        motivationText: '어르신 병원동행과 진료 안내 경험을 살리고 싶습니다.'
      })
    })

    return response
  }

  if (action === 'ops_verify_requirement') {
    const managerApplicationId = text(body.managerApplicationId)
    const requirementCode = text(body.requirementCode)
    const documentTitle = text(body.documentTitle) || requirementCode
    const reviewerName = text(body.reviewerName) || '운영실'

    if (!managerApplicationId || !requirementCode) {
      return NextResponse.json({ ok: false, message: '지원자와 검증 항목이 필요합니다.' }, { status: 400 })
    }

    const insert = await createDocument({
      managerApplicationId,
      requirementCode,
      documentTitle,
      documentMemo: text(body.documentMemo) || '운영실 확인 완료',
      status: 'verified',
      submittedByName: reviewerName,
      submittedByRole: 'ops',
      reviewedBy: reviewerName
    })

    if (!insert.ok) {
      return NextResponse.json({ ok: false, message: '확인 기록 저장 실패', detail: insert.error }, { status: 500 })
    }

    await rest('care_manager_applications?id=eq.' + encodeURIComponent(managerApplicationId), {
      method: 'PATCH',
      body: JSON.stringify({
        vetting_status: 'in_review',
        updated_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      ok: true,
      message: '검증 항목을 확인 완료로 기록했습니다.',
      document: firstRow(insert)
    })
  }

  if (action === 'mark_document_verified' || action === 'mark_document_rejected') {
    const documentId = text(body.documentId)
    const reviewerName = text(body.reviewerName) || '운영실'

    if (!documentId) {
      return NextResponse.json({ ok: false, message: 'documentId가 필요합니다.' }, { status: 400 })
    }

    const status = action === 'mark_document_verified' ? 'verified' : 'rejected'

    const patch = await rest('care_manager_verification_documents?id=eq.' + encodeURIComponent(documentId), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        verification_status: status,
        reviewed_by: reviewerName,
        reviewed_by_role: 'ops',
        reviewed_at: new Date().toISOString(),
        rejected_reason: status === 'rejected' ? text(body.rejectedReason) || '보완 필요' : null,
        updated_at: new Date().toISOString()
      })
    })

    if (!patch.ok) {
      return NextResponse.json({ ok: false, message: '서류 상태 변경 실패', detail: patch.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: status === 'verified' ? '서류를 확인 완료했습니다.' : '서류를 반려했습니다.',
      document: firstRow(patch)
    })
  }

  if (action === 'approve_if_ready') {
    const managerApplicationId = text(body.managerApplicationId)

    if (!managerApplicationId) {
      return NextResponse.json({ ok: false, message: 'managerApplicationId가 필요합니다.' }, { status: 400 })
    }

    const [requirements, documents, application] = await Promise.all([
      getRequirements(),
      getDocumentsForApplication(managerApplicationId),
      getApplication(managerApplicationId)
    ])

    if (!application) {
      return NextResponse.json({ ok: false, message: '지원자를 찾지 못했습니다.' }, { status: 404 })
    }

    const ready = readiness(requirements, documents)

    if (!ready.ready) {
      return NextResponse.json(
        {
          ok: false,
          message: '아직 필수 검증 항목이 남아 있습니다.',
          missing: ready.missing
        },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const appPatch = await rest('care_manager_applications?id=eq.' + encodeURIComponent(managerApplicationId), {
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

    if (!appPatch.ok) {
      return NextResponse.json({ ok: false, message: '지원자 승인 실패', detail: appPatch.error }, { status: 500 })
    }

    const app = firstRow(appPatch)

    const profile = await rest('care_manager_profiles?on_conflict=application_id', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify([
        {
          application_id: app.id,
          manager_name: app.applicant_name,
          manager_phone: app.applicant_phone,
          profile_status: 'active',
          trust_level: 'standard',
          identity_verified: true,
          identity_verified_at: now,
          certifications: app.certifications || [],
          available_regions: app.available_regions || [],
          specialties: app.specialties || [],
          service_scopes: app.service_scopes || [],
          vehicle_owned: Boolean(app.vehicle_owned),
          driving_license_owned: Boolean(app.driving_license_owned),
          direct_transport_included: false,
          trust_card_summary: `${app.applicant_name} · 최초 검증 완료 · 요양보호/병원동행/안전정책 확인`,
          public_notes: '검증 완료 매니저입니다. 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.',
          review_summary: '신규 검증 매니저',
          approved_at: now
        }
      ])
    })

    if (!profile.ok) {
      return NextResponse.json({ ok: false, message: '매니저 프로필 생성 실패', detail: profile.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: '검증 매니저 풀에 등록했습니다.',
      application: app,
      profile: firstRow(profile)
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}
