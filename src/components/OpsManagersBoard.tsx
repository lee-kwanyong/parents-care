'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

type AnyRow = Record<string, any>

type VettingDashboard = {
  requirements: AnyRow[]
  applications: AnyRow[]
  documents: AnyRow[]
}

function asList(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function labelStatus(status: string) {
  const map: Record<string, string> = {
    submitted: '지원 완료',
    approved: '승인 완료',
    rejected: '반려',
    pending: '대기',
    in_review: '검토 중',
    not_started: '검증 전',
    verified: '확인 완료',
    rejected_document: '서류 반려'
  }

  return map[status] || status || '대기'
}

function labelVetting(status: string) {
  const map: Record<string, string> = {
    not_started: '검증 전',
    in_review: '검토 중',
    approved: '검증 완료',
    rejected: '반려'
  }

  return map[status] || status || '검증 전'
}

function formatDate(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function requirementTitle(requirement: AnyRow) {
  return (
    requirement.requirement_title ||
    requirement.title ||
    requirement.label ||
    requirement.name ||
    requirement.code ||
    '검증 항목'
  )
}

function documentTitle(document: AnyRow) {
  return (
    document.document_title ||
    document.requirement_code ||
    document.file_name ||
    '제출 자료'
  )
}

function getDocsForApplication(documents: AnyRow[], applicationId: string) {
  return documents.filter((document) => document.manager_application_id === applicationId)
}

function getVerifiedCodes(documents: AnyRow[]) {
  return new Set(
    documents
      .filter((document) => document.verification_status === 'verified')
      .map((document) => document.requirement_code)
  )
}

function getReadiness(requirements: AnyRow[], documents: AnyRow[]) {
  const required = requirements.filter((item) => item.is_required !== false)
  const verifiedCodes = getVerifiedCodes(documents)
  const missing = required.filter((item) => !verifiedCodes.has(item.code))

  return {
    total: required.length,
    verified: required.length - missing.length,
    missing,
    ready: missing.length === 0
  }
}

export function OpsManagersBoard() {
  const [data, setData] = useState<VettingDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedId, setSelectedId] = useState('')

  const applications = data?.applications || []
  const requirements = data?.requirements || []
  const documents = data?.documents || []

  const selectedApplication = useMemo(() => {
    return applications.find((item) => item.id === selectedId) || null
  }, [applications, selectedId])

  const selectedDocuments = useMemo(() => {
    if (!selectedApplication) return []
    return getDocsForApplication(documents, selectedApplication.id)
  }, [documents, selectedApplication])

  const readiness = useMemo(() => {
    return getReadiness(requirements, selectedDocuments)
  }, [requirements, selectedDocuments])

  const summary = useMemo(() => {
    return {
      total: applications.length,
      submitted: applications.filter((item) => item.application_status === 'submitted').length,
      inReview: applications.filter((item) => item.vetting_status === 'in_review').length,
      approved: applications.filter((item) => item.application_status === 'approved' || item.vetting_status === 'approved').length,
      matchingEligible: applications.filter((item) => item.matching_eligible).length
    }
  }, [applications])

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-easy-vetting', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '매니저 검증 정보를 불러오지 못했습니다.')
      }

      setData(result)

      if (!selectedId && result.applications?.[0]?.id) {
        setSelectedId(result.applications[0].id)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매니저 검증 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function postAction(payload: Record<string, unknown>) {
    setWorking(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-easy-vetting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '처리 중 오류가 발생했습니다.')
      }

      setMessage(result.message || '처리됐습니다.')

      if (result.application?.id) {
        setSelectedId(result.application.id)
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setWorking(false)
    }
  }

  async function createDemoApplication() {
    await postAction({
      action: 'create_demo_application'
    })
  }

  async function verifyRequirement(requirement: AnyRow) {
    if (!selectedApplication) return

    await postAction({
      action: 'ops_verify_requirement',
      managerApplicationId: selectedApplication.id,
      requirementCode: requirement.code,
      documentTitle: requirementTitle(requirement),
      documentMemo: '운영실에서 확인 완료',
      reviewerName: '운영실'
    })
  }

  async function verifyAllRequired() {
    if (!selectedApplication) return

    setWorking(true)
    setMessage('')

    try {
      const required = requirements.filter((item) => item.is_required !== false)
      const verifiedCodes = getVerifiedCodes(selectedDocuments)
      const targets = required.filter((item) => !verifiedCodes.has(item.code))

      for (const requirement of targets) {
        const response = await fetch('/api/manager-easy-vetting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ops_verify_requirement',
            managerApplicationId: selectedApplication.id,
            requirementCode: requirement.code,
            documentTitle: requirementTitle(requirement),
            documentMemo: '운영실 일괄 확인 완료',
            reviewerName: '운영실'
          })
        })

        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.message || '검증 항목 확인 중 오류가 발생했습니다.')
        }
      }

      setMessage('필수 검증 항목을 확인 완료했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '검증 항목 확인 중 오류가 발생했습니다.')
    } finally {
      setWorking(false)
    }
  }

  async function approveManager() {
    if (!selectedApplication) return

    await postAction({
      action: 'approve_if_ready',
      managerApplicationId: selectedApplication.id
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppFrame
      title="매니저 승인 관리"
      subtitle="매니저 지원자를 검증하고 매칭 가능한 매니저 풀에 등록합니다"
      showMobileNav={false}
    >
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <CareCard tone="green">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill text="운영실" tone="green" />
              <StatusPill text="매니저 검증" tone="slate" />
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
              매니저를 검증하고
              <br />
              매칭 가능 상태로 등록합니다.
            </h1>

            <p className="mt-4 text-base font-bold leading-7 text-[#4E6D69]">
              지원자가 등록하면 운영실이 자격, 경력, 동의, 활동지역을 확인하고 승인합니다. 승인된 매니저만 매칭 후보로 올라갑니다.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <CareButton href="/manager/register">
                매니저 등록 페이지
              </CareButton>
              <CareButton href="/ops/matching" tone="dark">
                매칭관리로 이동
              </CareButton>
              <button
                type="button"
                onClick={createDemoApplication}
                disabled={working}
                className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2] disabled:opacity-60"
              >
                데모 지원자 만들기
              </button>
            </div>
          </CareCard>

          <section className="grid gap-3 md:grid-cols-5">
            <Stat label="전체" value={summary.total} />
            <Stat label="지원 완료" value={summary.submitted} />
            <Stat label="검토 중" value={summary.inReview} />
            <Stat label="승인" value={summary.approved} />
            <Stat label="매칭 가능" value={summary.matchingEligible} />
          </section>

          {message ? (
            <div className="rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
              {message}
            </div>
          ) : null}

          {loading ? (
            <CareCard tone="white">
              <p className="text-lg font-black">불러오는 중...</p>
            </CareCard>
          ) : null}

          <CareCard tone="white">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black">매니저 지원자</h2>
                <p className="mt-2 text-sm font-bold text-[#607D79]">
                  지원자를 선택하면 오른쪽에서 검증과 승인을 처리할 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={load}
                className="rounded-2xl bg-[#F4FAF9] px-4 py-3 text-sm font-black text-[#426C68] ring-1 ring-[#DDEDE9]"
              >
                새로고침
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {applications.length === 0 ? (
                <div className="space-y-3">
                  <Empty message="아직 매니저 지원자가 없습니다." />
                  <Link href="/manager/register" className="block rounded-2xl bg-[#19B99A] px-5 py-4 text-center font-black text-white">
                    매니저 등록 받기
                  </Link>
                </div>
              ) : (
                applications.map((application) => {
                  const docs = getDocsForApplication(documents, application.id)
                  const itemReadiness = getReadiness(requirements, docs)

                  return (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => setSelectedId(application.id)}
                      className={
                        'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                        (selectedId === application.id
                          ? 'bg-emerald-50 ring-emerald-400'
                          : 'bg-[#F8FCFB] ring-[#E3EFEC] hover:bg-white')
                      }
                    >
                      <div className="flex flex-wrap gap-2">
                        <Badge text={labelStatus(application.application_status)} />
                        <Badge text={labelVetting(application.vetting_status)} />
                        {application.matching_eligible ? <Badge text="매칭 가능" /> : null}
                        <Badge text={`${itemReadiness.verified}/${itemReadiness.total} 확인`} />
                      </div>

                      <div className="mt-3 text-xl font-black">
                        {application.applicant_name || '이름 없음'}
                      </div>

                      <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                        {application.applicant_phone || '연락처 없음'} · {application.address_text || '주소 미입력'}
                      </p>

                      <p className="mt-2 text-xs font-bold text-[#8AA29E]">
                        등록 {formatDate(application.created_at)}
                      </p>
                    </button>
                  )
                })
              )}
            </div>
          </CareCard>
        </div>

        <div className="space-y-5">
          {!selectedApplication ? (
            <CareCard tone="white">
              <Empty message="왼쪽에서 매니저 지원자를 선택하세요." />
            </CareCard>
          ) : (
            <>
              <CareCard tone="white">
                <div className="flex flex-wrap gap-2">
                  <StatusPill text="선택한 지원자" tone="green" />
                  <StatusPill text={labelStatus(selectedApplication.application_status)} tone="slate" />
                  <StatusPill text={labelVetting(selectedApplication.vetting_status)} tone="blue" />
                  {selectedApplication.matching_eligible ? <StatusPill text="매칭 가능" tone="green" /> : null}
                </div>

                <h2 className="mt-4 text-3xl font-black">
                  {selectedApplication.applicant_name || '이름 없음'}
                </h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Info label="연락처" value={selectedApplication.applicant_phone || '-'} />
                  <Info label="출생연도" value={String(selectedApplication.birth_year || '-')} />
                  <Info label="거주지" value={selectedApplication.address_text || '-'} />
                  <Info label="경력" value={`${selectedApplication.career_years || 0}년`} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <Info label="활동 가능 지역" value={asList(selectedApplication.available_regions).join(', ') || '-'} />
                  <Info label="가능 시간" value={asList(selectedApplication.available_time_slots).join(', ') || '-'} />
                  <Info label="전문 분야" value={asList(selectedApplication.specialties).join(', ') || '-'} />
                  <Info label="수행 가능 업무" value={asList(selectedApplication.service_scopes).join(', ') || '-'} />
                </div>

                <div className="mt-5 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#E3EFEC]">
                  <div className="text-sm font-black text-[#718A87]">경력 요약</div>
                  <p className="mt-2 whitespace-pre-line text-base font-bold leading-7 text-[#24423F]">
                    {selectedApplication.career_summary || '경력 요약이 없습니다.'}
                  </p>
                </div>

                <div className="mt-5 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#E3EFEC]">
                  <div className="text-sm font-black text-[#718A87]">소개</div>
                  <p className="mt-2 whitespace-pre-line text-base font-bold leading-7 text-[#24423F]">
                    {selectedApplication.intro_text || '소개글이 없습니다.'}
                  </p>
                </div>
              </CareCard>

              <CareCard tone={readiness.ready ? 'green' : 'amber'}>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill text="검증 준비도" tone={readiness.ready ? 'green' : 'blue'} />
                  <StatusPill text={`${readiness.verified}/${readiness.total} 확인`} tone="slate" />
                </div>

                <h2 className="mt-4 text-2xl font-black">
                  {readiness.ready ? '승인 가능한 상태입니다.' : '필수 확인 항목이 남아 있습니다.'}
                </h2>

                <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                  필수 검증 항목을 확인하면 매니저를 검증 완료 풀에 등록할 수 있습니다.
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={verifyAllRequired}
                    disabled={working || readiness.ready}
                    className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2] disabled:opacity-50"
                  >
                    필수 항목 일괄 확인
                  </button>

                  <button
                    type="button"
                    onClick={approveManager}
                    disabled={working}
                    className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white disabled:opacity-50"
                  >
                    검증 완료 매니저 풀 등록
                  </button>
                </div>
              </CareCard>

              <CareCard tone="white">
                <h2 className="text-2xl font-black">검증 항목</h2>
                <p className="mt-2 text-sm font-bold text-[#607D79]">
                  운영실에서 확인한 항목은 확인 완료로 기록됩니다.
                </p>

                <div className="mt-5 space-y-3">
                  {requirements.length === 0 ? (
                    <Empty message="검증 항목 설정이 없습니다. 그래도 승인 버튼으로 프로필 등록을 시도할 수 있습니다." />
                  ) : (
                    requirements.map((requirement) => {
                      const verifiedCodes = getVerifiedCodes(selectedDocuments)
                      const isVerified = verifiedCodes.has(requirement.code)

                      return (
                        <div key={requirement.code} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#E3EFEC]">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="flex flex-wrap gap-2">
                                <Badge text={requirement.is_required === false ? '선택' : '필수'} />
                                <Badge text={isVerified ? '확인 완료' : '미확인'} />
                              </div>
                              <h3 className="mt-3 text-lg font-black">{requirementTitle(requirement)}</h3>
                              <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                                {requirement.description || requirement.help_text || requirement.code}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => verifyRequirement(requirement)}
                              disabled={working || isVerified}
                              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#426C68] ring-1 ring-[#CFE7E2] disabled:opacity-50"
                            >
                              {isVerified ? '확인됨' : '확인 완료'}
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CareCard>

              <CareCard tone="white">
                <h2 className="text-2xl font-black">제출 자료</h2>

                <div className="mt-5 space-y-3">
                  {selectedDocuments.length === 0 ? (
                    <Empty message="아직 제출된 검증 자료가 없습니다." />
                  ) : (
                    selectedDocuments.map((document) => (
                      <div key={document.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#E3EFEC]">
                        <div className="flex flex-wrap gap-2">
                          <Badge text={labelStatus(document.verification_status)} />
                          <Badge text={document.requirement_code || '항목 없음'} />
                        </div>

                        <div className="mt-3 text-lg font-black">
                          {documentTitle(document)}
                        </div>

                        <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                          {document.document_memo || document.file_name || '메모 없음'}
                        </p>

                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => postAction({ action: 'mark_document_verified', documentId: document.id, reviewerName: '운영실' })}
                            disabled={working || document.verification_status === 'verified'}
                            className="rounded-2xl bg-[#EAFBF6] px-4 py-3 text-sm font-black text-[#2F756B] disabled:opacity-50"
                          >
                            서류 확인 완료
                          </button>
                          <button
                            type="button"
                            onClick={() => postAction({ action: 'mark_document_rejected', documentId: document.id, reviewerName: '운영실', rejectedReason: '보완 필요' })}
                            disabled={working}
                            className="rounded-2xl bg-[#FFF0F1] px-4 py-3 text-sm font-black text-[#965D65] disabled:opacity-50"
                          >
                            보완 요청
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CareCard>
            </>
          )}
        </div>
      </section>
    </AppFrame>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-[#E3EFEC]">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#E3EFEC]">
      <div className="text-xs font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-base font-black">{value}</div>
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

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-center font-black text-[#607D79] ring-1 ring-[#E3EFEC]">
      {message}
    </div>
  )
}
