'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Requirement = {
  id: string
  code: string
  title: string
  description: string | null
  category: string
  is_required: boolean
  requires_file: boolean
  sort_order: number
}

type Application = {
  id: string
  applicant_name: string
  applicant_phone: string
  application_status: string
  vetting_status: string
  matching_eligible: boolean
  created_at: string
}

type DocumentRow = {
  id: string
  manager_application_id: string
  requirement_code: string
  document_title: string
  document_memo: string | null
  file_name: string | null
  storage_path: string | null
  verification_status: string
  reviewed_by: string | null
  reviewed_at: string | null
  rejected_reason: string | null
  created_at: string
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    submitted: '제출됨',
    verified: '확인 완료',
    rejected: '반려',
    approved: '승인',
    in_review: '검토 중',
    not_started: '시작 전',
    pending: '대기'
  }

  return map[status] || status
}

function categoryLabel(category: string) {
  const map: Record<string, string> = {
    identity: '신원',
    qualification: '자격',
    training: '교육',
    policy: '정책',
    interview: '면접'
  }

  return map[category] || category
}

export function ManagerVettingBoard({ mode = 'ops' }: { mode?: 'ops' | 'manager' }) {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [selectedRequirementCode, setSelectedRequirementCode] = useState('')
  const [documentMemo, setDocumentMemo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-vetting', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '매니저 검증 정보를 불러오지 못했습니다.')
      }

      setRequirements(result.requirements || [])
      setApplications(result.applications || [])
      setDocuments(result.documents || [])

      if (!selectedApplicationId && result.applications?.[0]?.id) {
        setSelectedApplicationId(result.applications[0].id)
      }

      if (!selectedRequirementCode && result.requirements?.[0]?.code) {
        setSelectedRequirementCode(result.requirements[0].code)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매니저 검증 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createDemoApplication() {
    setMessage('')

    try {
      const response = await fetch('/api/manager-vetting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_demo_application' })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '데모 지원자 생성 실패')
      }

      setMessage(result.message)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '데모 지원자 생성 실패')
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedApplicationId || !selectedRequirementCode) {
      setMessage('매니저 지원자와 검증 항목을 선택해주세요.')
      return
    }

    const requirement = requirements.find((item) => item.code === selectedRequirementCode)

    setSubmitting(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('action', 'upload_document')
      formData.append('managerApplicationId', selectedApplicationId)
      formData.append('requirementCode', selectedRequirementCode)
      formData.append('documentTitle', requirement?.title || selectedRequirementCode)
      formData.append('documentMemo', documentMemo)
      formData.append('submittedByName', mode === 'manager' ? '매니저' : '운영실')
      formData.append('submittedByRole', mode)

      if (file) {
        formData.append('file', file)
      }

      const response = await fetch('/api/manager-vetting', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '검증 서류 등록 실패')
      }

      setMessage(result.message)
      setDocumentMemo('')
      setFile(null)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '검증 서류 등록 실패')
    } finally {
      setSubmitting(false)
    }
  }

  async function postAction(payload: Record<string, unknown>) {
    setMessage('')

    try {
      const response = await fetch('/api/manager-vetting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        const missing = Array.isArray(result.missing) ? ` 미완료: ${result.missing.join(', ')}` : ''
        throw new Error((result.message || '처리 중 오류가 발생했습니다.') + missing)
      }

      setMessage(result.message || '처리됐습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selectedApplication = applications.find((item) => item.id === selectedApplicationId)

  const documentsByApplication = useMemo(() => {
    const map = new Map<string, DocumentRow[]>()

    for (const document of documents) {
      const list = map.get(document.manager_application_id) || []
      list.push(document)
      map.set(document.manager_application_id, list)
    }

    return map
  }, [documents])

  const selectedDocuments = selectedApplicationId
    ? documentsByApplication.get(selectedApplicationId) || []
    : []

  const verifiedCodes = new Set(
    selectedDocuments
      .filter((item) => item.verification_status === 'verified')
      .map((item) => item.requirement_code)
  )

  const requiredRequirements = requirements.filter((item) => item.is_required)
  const missingRequirements = requiredRequirements.filter((item) => !verifiedCodes.has(item.code))
  const readinessPercent = requiredRequirements.length
    ? Math.round(((requiredRequirements.length - missingRequirements.length) / requiredRequirements.length) * 100)
    : 0

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-black text-[#19A98E]">
              {mode === 'manager' ? '매니저 지원' : '운영실'}
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
              최초 검증 시스템
            </h1>
            <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79]">
              요양보호사 자격증, 신분 확인, 교육, 면접, 정책 동의까지 최초 채용 단계에서 견고하게 확인합니다.
              매칭 단계에서는 이미 검증된 매니저만 알림을 받습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={load}
              className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78] ring-1 ring-[#C2DDEA]"
            >
              새로고침
            </button>
            {mode === 'ops' ? (
              <button
                onClick={createDemoApplication}
                className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white"
              >
                데모 지원자 생성
              </button>
            ) : null}
            <Link
              href={mode === 'manager' ? '/manager' : '/ops'}
              className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              홈으로
            </Link>
          </div>
        </header>

        <section className="rounded-[2rem] border border-[#D5EEE8] bg-[#EAFBF6] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)]">
          <div className="text-sm font-black text-[#3F706B]">검증 안심판</div>
          <h2 className="mt-2 text-5xl font-black tracking-[-0.04em]">
            {selectedApplication ? `${readinessPercent}%` : '대기'}
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <Stat label="지원자" value={applications.length} />
            <Stat label="필수 항목" value={requiredRequirements.length} />
            <Stat label="확인 완료" value={requiredRequirements.length - missingRequirements.length} />
            <Stat label="미완료" value={missingRequirements.length} />
            <Stat label="서류 기록" value={selectedDocuments.length} />
          </div>
        </section>

        {message ? (
          <p className="mt-6 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </p>
        ) : null}

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <h2 className="text-2xl font-black">매니저 지원자</h2>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="rounded-2xl bg-[#F6FCFA] p-4 font-black">불러오는 중...</div>
              ) : applications.length === 0 ? (
                <div className="rounded-2xl bg-[#F6FCFA] p-4 font-bold text-[#607D79]">
                  아직 매니저 지원자가 없습니다.
                </div>
              ) : (
                applications.map((application) => (
                  <button
                    key={application.id}
                    onClick={() => setSelectedApplicationId(application.id)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                      (selectedApplicationId === application.id
                        ? 'bg-[#EAFBF6] ring-[#BDE7DD]'
                        : 'bg-[#F6FCFA] ring-[#E3EFEC]')
                    }
                  >
                    <div className="text-lg font-black">{application.applicant_name}</div>
                    <div className="mt-1 text-sm font-bold text-[#607D79]">
                      {application.applicant_phone || '연락처 없음'}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge text={statusLabel(application.application_status)} />
                      <Badge text={statusLabel(application.vetting_status || 'not_started')} />
                      {application.matching_eligible ? <Badge text="매칭 가능" /> : <Badge text="매칭 불가" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <h2 className="text-2xl font-black">검증 항목 등록</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                파일이 필요한 항목은 자격증/수료증 이미지를 올리고, 신분 확인이나 정책 동의는 운영실 확인 기록으로 남길 수 있습니다.
              </p>

              <form onSubmit={uploadDocument} className="mt-5 grid gap-4">
                <select
                  value={selectedApplicationId}
                  onChange={(event) => setSelectedApplicationId(event.target.value)}
                  className="rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold outline-none"
                >
                  <option value="">매니저 지원자 선택</option>
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.applicant_name} / {application.applicant_phone}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRequirementCode}
                  onChange={(event) => setSelectedRequirementCode(event.target.value)}
                  className="rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold outline-none"
                >
                  {requirements.map((requirement) => (
                    <option key={requirement.code} value={requirement.code}>
                      [{categoryLabel(requirement.category)}] {requirement.title}
                      {requirement.requires_file ? ' / 파일 권장' : ''}
                    </option>
                  ))}
                </select>

                <input
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold"
                />

                <textarea
                  value={documentMemo}
                  onChange={(event) => setDocumentMemo(event.target.value)}
                  rows={3}
                  className="rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold outline-none"
                  placeholder="검토 메모. 예: 요양보호사 자격증 확인, 원본 대조 완료"
                />

                <button
                  disabled={submitting}
                  className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white disabled:opacity-60"
                >
                  {submitting ? '등록 중...' : mode === 'manager' ? '검증 자료 제출' : '검증 항목 등록'}
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">필수 검증 현황</h2>
                  <p className="mt-2 text-sm font-bold text-[#607D79]">
                    모든 필수 항목이 확인 완료되어야 검증 매니저 풀에 등록됩니다.
                  </p>
                </div>

                {mode === 'ops' && selectedApplicationId ? (
                  <button
                    onClick={() => postAction({ action: 'approve_if_ready', managerApplicationId: selectedApplicationId })}
                    className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white"
                  >
                    필수 완료 시 최종 승인
                  </button>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {requirements.map((requirement) => {
                  const docs = selectedDocuments.filter((document) => document.requirement_code === requirement.code)
                  const verified = docs.some((document) => document.verification_status === 'verified')

                  return (
                    <div
                      key={requirement.code}
                      className={
                        'rounded-2xl p-4 ring-1 ' +
                        (verified ? 'bg-[#EAFBF6] ring-[#BDE7DD]' : 'bg-[#F6FCFA] ring-[#E3EFEC]')
                      }
                    >
                      <div className="flex flex-wrap gap-2">
                        <Badge text={categoryLabel(requirement.category)} />
                        {requirement.is_required ? <Badge text="필수" /> : <Badge text="선택" />}
                        {requirement.requires_file ? <Badge text="파일" /> : <Badge text="확인기록" />}
                        {verified ? <Badge text="완료" /> : <Badge text="미완료" />}
                      </div>
                      <h3 className="mt-3 text-lg font-black">{requirement.title}</h3>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                        {requirement.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <h2 className="text-2xl font-black">제출/확인 기록</h2>

              <div className="mt-5 space-y-3">
                {selectedDocuments.length === 0 ? (
                  <div className="rounded-2xl bg-[#F6FCFA] p-5 font-bold text-[#607D79]">
                    아직 제출된 검증 기록이 없습니다.
                  </div>
                ) : (
                  selectedDocuments.map((document) => (
                    <div key={document.id} className="rounded-2xl bg-[#F6FCFA] p-5">
                      <div className="flex flex-wrap gap-2">
                        <Badge text={document.requirement_code} />
                        <Badge text={statusLabel(document.verification_status)} />
                        {document.file_name ? <Badge text="파일 있음" /> : <Badge text="확인기록" />}
                      </div>

                      <h3 className="mt-3 text-lg font-black">{document.document_title}</h3>

                      {document.document_memo ? (
                        <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                          {document.document_memo}
                        </p>
                      ) : null}

                      {document.file_name ? (
                        <p className="mt-2 text-xs font-bold text-[#8AA29E]">
                          파일명: {document.file_name}
                        </p>
                      ) : null}

                      {document.rejected_reason ? (
                        <p className="mt-2 rounded-xl bg-[#FFF0F1] p-3 text-sm font-bold text-[#965D65]">
                          반려 사유: {document.rejected_reason}
                        </p>
                      ) : null}

                      {mode === 'ops' ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => postAction({ action: 'mark_verified', documentId: document.id })}
                            className="rounded-xl bg-[#19B99A] px-4 py-3 text-sm font-black text-white"
                          >
                            확인 완료
                          </button>
                          <button
                            onClick={() => postAction({ action: 'mark_rejected', documentId: document.id, rejectedReason: '보완 필요' })}
                            className="rounded-xl bg-[#FFF0F1] px-4 py-3 text-sm font-black text-[#965D65]"
                          >
                            반려
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
      {text}
    </span>
  )
}
