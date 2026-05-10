'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Requirement = {
  id: string
  code: string
  title: string
  description: string | null
  category: string
  step_no: number
  step_title: string
  is_required: boolean
  requires_file: boolean
  manager_hint: string | null
  ops_hint: string | null
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

export function ManagerStepVettingBoard({ mode = 'ops' }: { mode?: 'ops' | 'manager' }) {
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
      const response = await fetch('/api/manager-easy-vetting', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '검증 정보를 불러오지 못했습니다.')
      }

      setRequirements(result.requirements || [])
      setApplications(result.applications || [])
      setDocuments(result.documents || [])

      const firstApplicationId = result.applications?.[0]?.id || ''
      const firstRequirementCode = result.requirements?.[0]?.code || ''

      if (!selectedApplicationId && firstApplicationId) setSelectedApplicationId(firstApplicationId)
      if (!selectedRequirementCode && firstRequirementCode) setSelectedRequirementCode(firstRequirementCode)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '검증 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function postAction(payload: Record<string, unknown>) {
    setMessage('')

    try {
      const response = await fetch('/api/manager-easy-vetting', {
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

  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedApplicationId || !selectedRequirementCode) {
      setMessage('지원자와 검증 항목을 선택해주세요.')
      return
    }

    const requirement = requirements.find((item) => item.code === selectedRequirementCode)

    setSubmitting(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('action', 'submit_document')
      formData.append('managerApplicationId', selectedApplicationId)
      formData.append('requirementCode', selectedRequirementCode)
      formData.append('documentTitle', requirement?.title || selectedRequirementCode)
      formData.append('documentMemo', documentMemo)
      formData.append('submittedByName', mode === 'ops' ? '운영실' : '매니저')
      formData.append('submittedByRole', mode)

      if (file) formData.append('file', file)

      const response = await fetch('/api/manager-easy-vetting', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '검증 자료 제출 중 오류가 발생했습니다.')
      }

      setMessage(result.message)
      setDocumentMemo('')
      setFile(null)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '검증 자료 제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selectedApplication = applications.find((item) => item.id === selectedApplicationId)

  const selectedDocuments = documents.filter((item) => item.manager_application_id === selectedApplicationId)

  const latestDocByCode = useMemo(() => {
    const map = new Map<string, DocumentRow>()
    for (const document of selectedDocuments) {
      if (!map.has(document.requirement_code)) map.set(document.requirement_code, document)
    }
    return map
  }, [selectedDocuments])

  const verifiedCodes = new Set(
    selectedDocuments
      .filter((item) => item.verification_status === 'verified')
      .map((item) => item.requirement_code)
  )

  const requiredRequirements = requirements.filter((item) => item.is_required)
  const missingRequirements = requiredRequirements.filter((item) => !verifiedCodes.has(item.code))
  const progressPercent = requiredRequirements.length
    ? Math.round(((requiredRequirements.length - missingRequirements.length) / requiredRequirements.length) * 100)
    : 0

  const groupedSteps = useMemo(() => {
    const map = new Map<number, Requirement[]>()
    for (const requirement of requirements) {
      const list = map.get(requirement.step_no) || []
      list.push(requirement)
      map.set(requirement.step_no, list)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [requirements])

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-black text-[#19A98E]">
              {mode === 'ops' ? '운영실' : '매니저'}
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
              단계별 검증
            </h1>
            <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79]">
              최초 검증을 견고하게 만들고, 이후 매칭은 검증된 매니저에게만 알림이 가도록 합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={load} className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78] ring-1 ring-[#C2DDEA]">
              새로고침
            </button>
            {mode === 'ops' ? (
              <button onClick={() => postAction({ action: 'create_demo_application' })} className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                데모 지원자 생성
              </button>
            ) : (
              <Link href="/manager/apply" className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                간단 등록
              </Link>
            )}
            <Link href={mode === 'ops' ? '/ops' : '/manager'} className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
              홈으로
            </Link>
          </div>
        </header>

        <section className="rounded-[2rem] border border-[#D5EEE8] bg-[#EAFBF6] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)]">
          <div className="text-sm font-black text-[#3F706B]">검증 진행률</div>
          <h2 className="mt-2 text-5xl font-black tracking-[-0.04em]">
            {selectedApplication ? `${progressPercent}%` : '대기'}
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <Stat label="지원자" value={applications.length} />
            <Stat label="필수 항목" value={requiredRequirements.length} />
            <Stat label="확인 완료" value={requiredRequirements.length - missingRequirements.length} />
            <Stat label="남은 항목" value={missingRequirements.length} />
            <Stat label="제출 기록" value={selectedDocuments.length} />
          </div>
        </section>

        {message ? (
          <div className="mt-6 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-5">
            <div className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <h2 className="text-2xl font-black">지원자 선택</h2>
              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="rounded-2xl bg-[#F6FCFA] p-4 font-black">불러오는 중...</div>
                ) : applications.length === 0 ? (
                  <div className="rounded-2xl bg-[#F6FCFA] p-5">
                    <p className="font-black">아직 매니저 지원자가 없습니다.</p>
                    <Link href="/manager/apply" className="mt-4 inline-block rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                      매니저 간단 등록
                    </Link>
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
                      <div className="mt-1 text-sm font-bold text-[#607D79]">{application.applicant_phone || '연락처 없음'}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge text={statusLabel(application.application_status)} />
                        <Badge text={statusLabel(application.vetting_status || 'not_started')} />
                        {application.matching_eligible ? <Badge text="매칭 가능" /> : <Badge text="검증 중" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={submitDocument} className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <h2 className="text-2xl font-black">간단 제출</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                서류가 있으면 사진을 올리고, 확인기록만 필요한 항목은 메모만 남겨도 됩니다.
              </p>

              <select value={selectedApplicationId} onChange={(event) => setSelectedApplicationId(event.target.value)} className="mt-4 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold">
                <option value="">지원자 선택</option>
                {applications.map((application) => (
                  <option key={application.id} value={application.id}>{application.applicant_name} / {application.applicant_phone}</option>
                ))}
              </select>

              <select value={selectedRequirementCode} onChange={(event) => setSelectedRequirementCode(event.target.value)} className="mt-3 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold">
                {requirements.map((requirement) => (
                  <option key={requirement.code} value={requirement.code}>
                    {requirement.step_no}단계 · {requirement.title}
                  </option>
                ))}
              </select>

              <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-3 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold" />

              <textarea value={documentMemo} onChange={(event) => setDocumentMemo(event.target.value)} rows={3} className="mt-3 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold" placeholder="메모. 예: 자격증 사진 제출, 전화 확인 완료" />

              <button disabled={submitting} className="mt-4 w-full rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white disabled:opacity-60">
                {submitting ? '제출 중...' : mode === 'ops' ? '검증 기록 등록' : '검증자료 제출'}
              </button>
            </form>
          </div>

          <div className="space-y-5">
            {groupedSteps.map(([stepNo, stepRequirements]) => {
              const stepTitle = stepRequirements[0]?.step_title || `${stepNo}단계`
              const stepVerified = stepRequirements.filter((requirement) => verifiedCodes.has(requirement.code)).length

              return (
                <section key={stepNo} className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <Badge text={`${stepNo}단계`} />
                      <h2 className="mt-3 text-2xl font-black">{stepTitle}</h2>
                    </div>
                    <div className="rounded-full bg-[#F4FAF9] px-4 py-2 text-sm font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
                      {stepVerified}/{stepRequirements.length} 완료
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {stepRequirements.map((requirement) => {
                      const docs = selectedDocuments.filter((doc) => doc.requirement_code === requirement.code)
                      const latest = latestDocByCode.get(requirement.code)
                      const verified = verifiedCodes.has(requirement.code)

                      return (
                        <div key={requirement.code} className={`rounded-2xl p-4 ring-1 ${verified ? 'bg-[#EAFBF6] ring-[#BDE7DD]' : 'bg-[#F6FCFA] ring-[#E3EFEC]'}`}>
                          <div className="flex flex-wrap gap-2">
                            <Badge text={requirement.is_required ? '필수' : '선택'} />
                            <Badge text={requirement.requires_file ? '파일 가능' : '확인기록'} />
                            <Badge text={verified ? '완료' : latest ? statusLabel(latest.verification_status) : '미완료'} />
                          </div>
                          <h3 className="mt-3 text-lg font-black">{requirement.title}</h3>
                          <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                            {mode === 'ops' ? requirement.ops_hint || requirement.description : requirement.manager_hint || requirement.description}
                          </p>

                          {latest ? (
                            <div className="mt-3 rounded-xl bg-white p-3 text-xs font-bold text-[#607D79] ring-1 ring-[#E3EFEC]">
                              최근 기록: {latest.document_title} · {statusLabel(latest.verification_status)}
                              {latest.file_name ? ` · ${latest.file_name}` : ''}
                            </div>
                          ) : null}

                          {mode === 'ops' && selectedApplicationId ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                onClick={() => postAction({
                                  action: 'ops_verify_requirement',
                                  managerApplicationId: selectedApplicationId,
                                  requirementCode: requirement.code,
                                  documentTitle: requirement.title,
                                  documentMemo: '운영실 확인 완료'
                                })}
                                className="rounded-xl bg-[#19B99A] px-4 py-3 text-sm font-black text-white"
                              >
                                확인 완료
                              </button>

                              {latest ? (
                                <>
                                  <button onClick={() => postAction({ action: 'mark_document_verified', documentId: latest.id })} className="rounded-xl bg-[#DCEFF7] px-4 py-3 text-sm font-black text-[#365E78]">
                                    제출자료 승인
                                  </button>
                                  <button onClick={() => postAction({ action: 'mark_document_rejected', documentId: latest.id, rejectedReason: '보완 필요' })} className="rounded-xl bg-[#FFF0F1] px-4 py-3 text-sm font-black text-[#965D65]">
                                    반려
                                  </button>
                                </>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            {mode === 'ops' && selectedApplication ? (
              <section className="rounded-[2rem] border border-[#D5EEE8] bg-[#EAFBF6] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)]">
                <h2 className="text-2xl font-black">최종 승인</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                  모든 필수 항목이 완료되어야 검증 매니저 풀에 등록됩니다.
                </p>
                <button
                  onClick={() => postAction({ action: 'approve_if_ready', managerApplicationId: selectedApplication.id })}
                  className="mt-5 w-full rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white"
                >
                  필수 완료 시 검증 매니저로 승인
                </button>
              </section>
            ) : null}
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
    <span className="inline-flex rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
      {text}
    </span>
  )
}
