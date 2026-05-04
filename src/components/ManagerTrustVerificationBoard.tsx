'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  buildManagerVerificationSummary,
  formatRating,
  labelManagerTrustLevel,
  labelManagerVerificationStatus,
  labelManagerVerificationType,
  managerVerificationTypeOptions,
  type CareManagerEvaluation,
  type CareManagerIdentityVerification,
  type ManagerTrustApplication,
  type ManagerTrustProfile,
  type ManagerVerificationStatus
} from '@/lib/manager-trust-engine'

export function ManagerTrustVerificationBoard({ mode = 'ops' }: { mode?: 'ops' | 'family' }) {
  const [applications, setApplications] = useState<ManagerTrustApplication[]>([])
  const [profiles, setProfiles] = useState<ManagerTrustProfile[]>([])
  const [verifications, setVerifications] = useState<CareManagerIdentityVerification[]>([])
  const [evaluations, setEvaluations] = useState<CareManagerEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-trust', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '매니저 검증 정보를 불러오지 못했습니다.')
      }

      setApplications(data.applications || [])
      setProfiles(data.profiles || [])
      setVerifications(data.verifications || [])
      setEvaluations(data.evaluations || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매니저 검증 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/manager-trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_verification',
          applicationId: formData.get('applicationId'),
          verificationType: formData.get('verificationType'),
          provider: formData.get('provider'),
          status: formData.get('status'),
          resultLabel: formData.get('resultLabel'),
          providerReference: formData.get('providerReference'),
          reviewerName: formData.get('reviewerName'),
          opsMemo: formData.get('opsMemo')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '검증 기록 생성 실패')
      }

      setMessage('검증 기록이 저장됐습니다.')
      form.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '검증 기록 생성 실패')
    }
  }

  async function createEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/manager-trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_evaluation',
          profileId: formData.get('profileId'),
          elderName: formData.get('elderName'),
          evaluatorName: formData.get('evaluatorName'),
          evaluatorPhone: formData.get('evaluatorPhone'),
          ratingSafety: formData.get('ratingSafety'),
          ratingKindness: formData.get('ratingKindness'),
          ratingAccuracy: formData.get('ratingAccuracy'),
          ratingPunctuality: formData.get('ratingPunctuality'),
          wouldRequestAgain: formData.get('wouldRequestAgain') === 'on',
          publicComment: formData.get('publicComment'),
          privateComment: formData.get('privateComment')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '평가 저장 실패')
      }

      setMessage('매니저 평가가 저장됐습니다. 신뢰카드 점수에 반영됩니다.')
      form.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '평가 저장 실패')
    }
  }

  async function updateVerification(id: string, status: ManagerVerificationStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/manager-trust', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'verification',
          id,
          status
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '검증 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '검증 상태 변경 실패')
    }
  }

  async function updateEvaluation(id: string, status: 'ops_reviewed' | 'hidden') {
    setMessage('')

    try {
      const response = await fetch('/api/manager-trust', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'evaluation',
          id,
          status
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '평가 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '평가 상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(
    () => buildManagerVerificationSummary(applications, verifications, profiles, evaluations),
    [applications, verifications, profiles, evaluations]
  )

  const verificationsByApplication = useMemo(() => {
    const map = new Map<string, CareManagerIdentityVerification[]>()

    for (const verification of verifications) {
      if (!verification.manager_application_id) continue
      const current = map.get(verification.manager_application_id) || []
      current.push(verification)
      map.set(verification.manager_application_id, current)
    }

    return map
  }, [verifications])

  const evaluationsByProfile = useMemo(() => {
    const map = new Map<string, CareManagerEvaluation[]>()

    for (const evaluation of evaluations) {
      const current = map.get(evaluation.manager_profile_id) || []
      current.push(evaluation)
      map.set(evaluation.manager_profile_id, current)
    }

    return map
  }, [evaluations])

  return (
    <div>
      <section
        className={
          'rounded-3xl p-6 shadow-sm ' +
          (summary.reassuranceState === '긴급'
            ? 'bg-red-50'
            : summary.reassuranceState === '확인 필요'
              ? 'bg-amber-50'
              : 'bg-emerald-50')
        }
      >
        <p className="text-sm font-black text-slate-600">매니저 신뢰 검증판</p>
        <h2 className="mt-2 text-5xl font-black">{summary.reassuranceState}</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="지원서" value={summary.applicationTotal} />
          <Stat label="매칭 가능" value={summary.eligibleApplicationTotal} />
          <Stat label="검증 기록" value={summary.verificationTotal} />
          <Stat label="활동 매니저" value={summary.activeProfileTotal} />
          <Stat label="평가" value={summary.evaluationTotal} />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">운영실이 할 일</h2>
        <div className="mt-4 space-y-3">
          {summary.opsNextActions.map((action, index) => (
            <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {index + 1}. {action}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      {mode === 'ops' ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <form onSubmit={createVerification} className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">매칭 전 검증 기록</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              휴대폰 본인확인, 신분 확인, 차량 정책, 면접 확인은 매칭 전 필수입니다.
            </p>

            <div className="mt-5 grid gap-3">
              <select name="applicationId" className="rounded-2xl border border-slate-200 p-4">
                {applications.length === 0 ? (
                  <option value="">지원서 없음</option>
                ) : (
                  applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.applicant_name} · {application.applicant_phone}
                    </option>
                  ))
                )}
              </select>

              <select name="verificationType" className="rounded-2xl border border-slate-200 p-4">
                {managerVerificationTypeOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.requiredBeforeMatching ? '[필수] ' : ''}
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 md:grid-cols-3">
                <select name="provider" className="rounded-2xl border border-slate-200 p-4">
                  <option value="ops">운영실</option>
                  <option value="nice">NICE</option>
                  <option value="kcb">KCB</option>
                  <option value="kakao">카카오</option>
                  <option value="manual">수동 확인</option>
                  <option value="partner">제휴기관</option>
                </select>

                <select name="status" className="rounded-2xl border border-slate-200 p-4">
                  <option value="verified">확인 완료</option>
                  <option value="pending">대기</option>
                  <option value="failed">실패</option>
                  <option value="waived">면제</option>
                  <option value="expired">만료</option>
                </select>

                <input name="reviewerName" className="rounded-2xl border border-slate-200 p-4" placeholder="검토자" defaultValue="운영실" />
              </div>

              <input name="resultLabel" className="rounded-2xl border border-slate-200 p-4" placeholder="결과 라벨. 예: 휴대폰 본인확인 완료" />
              <input name="providerReference" className="rounded-2xl border border-slate-200 p-4" placeholder="외부 인증 참조값. 원문 개인정보 저장 금지" />
              <textarea name="opsMemo" rows={3} className="rounded-2xl border border-slate-200 p-4" placeholder="운영실 메모" />
            </div>

            <button className="mt-4 w-full rounded-3xl bg-emerald-600 px-6 py-5 text-xl font-black text-white">
              검증 기록 저장
            </button>
          </form>

          <form onSubmit={createEvaluation} className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">매칭 후 평가 등록</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              안전, 친절, 정확성, 시간준수 점수가 매니저 신뢰카드에 반영됩니다.
            </p>

            <div className="mt-5 grid gap-3">
              <select name="profileId" className="rounded-2xl border border-slate-200 p-4">
                {profiles.length === 0 ? (
                  <option value="">승인된 매니저 없음</option>
                ) : (
                  profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.manager_name} · {labelManagerTrustLevel(profile.trust_level)}
                    </option>
                  ))
                )}
              </select>

              <div className="grid gap-3 md:grid-cols-3">
                <input name="elderName" className="rounded-2xl border border-slate-200 p-4" placeholder="부모님" defaultValue="어머니" />
                <input name="evaluatorName" className="rounded-2xl border border-slate-200 p-4" placeholder="평가자 이름" />
                <input name="evaluatorPhone" className="rounded-2xl border border-slate-200 p-4" placeholder="010-1234-5678" />
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <RatingSelect name="ratingSafety" label="안전" />
                <RatingSelect name="ratingKindness" label="친절" />
                <RatingSelect name="ratingAccuracy" label="정확성" />
                <RatingSelect name="ratingPunctuality" label="시간준수" />
              </div>

              <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <input name="wouldRequestAgain" type="checkbox" defaultChecked className="mt-1 h-5 w-5" />
                <span className="text-sm font-bold leading-6">다음에도 같은 매니저를 요청하고 싶습니다.</span>
              </label>

              <textarea name="publicComment" rows={3} className="rounded-2xl border border-slate-200 p-4" placeholder="가족 후기. 예: 천천히 설명해주시고 약국까지 잘 챙겨주셨어요." />
              <textarea name="privateComment" rows={3} className="rounded-2xl border border-slate-200 p-4" placeholder="운영실 참고 메모" />
            </div>

            <button className="mt-4 w-full rounded-3xl bg-slate-900 px-6 py-5 text-xl font-black text-white">
              평가 저장
            </button>
          </form>
        </section>
      ) : (
        <form onSubmit={createEvaluation} className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">동행매니저 평가</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            평가는 매니저 안심도에 반영됩니다.
          </p>

          <div className="mt-5 grid gap-3">
            <select name="profileId" className="rounded-2xl border border-slate-200 p-4">
              {profiles.length === 0 ? (
                <option value="">평가할 매니저 없음</option>
              ) : (
                profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.manager_name}
                  </option>
                ))
              )}
            </select>

            <div className="grid gap-3 md:grid-cols-3">
              <input name="elderName" className="rounded-2xl border border-slate-200 p-4" placeholder="부모님" defaultValue="어머니" />
              <input name="evaluatorName" className="rounded-2xl border border-slate-200 p-4" placeholder="내 이름" />
              <input name="evaluatorPhone" className="rounded-2xl border border-slate-200 p-4" placeholder="010-1234-5678" />
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <RatingSelect name="ratingSafety" label="안전" />
              <RatingSelect name="ratingKindness" label="친절" />
              <RatingSelect name="ratingAccuracy" label="정확성" />
              <RatingSelect name="ratingPunctuality" label="시간준수" />
            </div>

            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <input name="wouldRequestAgain" type="checkbox" defaultChecked className="mt-1 h-5 w-5" />
              <span className="text-sm font-bold leading-6">다음에도 같은 매니저를 요청하고 싶습니다.</span>
            </label>

            <textarea name="publicComment" rows={3} className="rounded-2xl border border-slate-200 p-4" placeholder="후기를 남겨주세요." />
          </div>

          <button className="mt-4 w-full rounded-3xl bg-emerald-600 px-6 py-5 text-xl font-black text-white">
            평가 제출
          </button>
        </form>
      )}

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            매니저 신뢰 정보를 불러오는 중...
          </div>
        ) : mode === 'ops' ? (
          applications.map((application) => {
            const appVerifications = verificationsByApplication.get(application.id) || []

            return (
              <article key={application.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={application.application_status} />
                      <Badge text={application.identity_verification_status} />
                      <Badge text={application.matching_eligible ? '매칭 가능' : '매칭 전 검증 필요'} />
                      {application.vehicle_owned ? <Badge text="차량 보유" /> : null}
                      <Badge text={application.direct_transport_included ? '직접 운송 포함' : '직접 운송 미포함'} />
                    </div>

                    <h3 className="mt-3 text-3xl font-black">{application.applicant_name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{application.applicant_phone}</p>

                    <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                      승인 전 필수: 휴대폰 본인확인, 신분 확인, 차량 정책 확인, 면접 확인.
                      차량 보유 여부는 참고 정보이며 직접 유상운송은 기본 서비스에 포함되지 않습니다.
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {managerVerificationTypeOptions.map((option) => {
                        const found = appVerifications.find((item) => item.verification_type === option.code && item.verification_status === 'verified')

                        return (
                          <div
                            key={option.code}
                            className={
                              'rounded-2xl p-4 ' +
                              (found
                                ? 'bg-emerald-50'
                                : option.requiredBeforeMatching
                                  ? 'bg-red-50'
                                  : 'bg-slate-50')
                            }
                          >
                            <div className="flex flex-wrap gap-2">
                              <Badge text={option.requiredBeforeMatching ? '필수' : '선택'} />
                              <Badge text={found ? '확인 완료' : '미완료'} />
                            </div>
                            <div className="mt-2 font-black">{option.label}</div>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{option.description}</p>
                          </div>
                        )
                      })}
                    </div>

                    {appVerifications.length > 0 ? (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <h4 className="font-black">검증 기록</h4>
                        <div className="mt-3 space-y-2">
                          {appVerifications.map((verification) => (
                            <div key={verification.id} className="rounded-xl bg-white p-3">
                              <div className="flex flex-wrap gap-2">
                                <Badge text={labelManagerVerificationType(verification.verification_type)} />
                                <Badge text={labelManagerVerificationStatus(verification.verification_status)} />
                                <Badge text={verification.provider} />
                              </div>
                              <p className="mt-2 text-sm text-slate-600">{verification.result_label || verification.ops_memo || '메모 없음'}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button onClick={() => updateVerification(verification.id, 'verified')} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                                  확인 완료
                                </button>
                                <button onClick={() => updateVerification(verification.id, 'failed')} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                                  실패
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-3xl font-black">매니저 신뢰카드</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {profiles.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm md:col-span-2">
              <div className="text-xl font-black">아직 승인된 매니저가 없습니다.</div>
            </div>
          ) : (
            profiles.map((profile) => {
              const profileEvaluations = evaluationsByProfile.get(profile.id) || []

              return (
                <article key={profile.id} className="rounded-3xl bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge text={labelManagerTrustLevel(profile.trust_level)} />
                    <Badge text={profile.identity_verified ? '본인확인 완료' : '본인확인 미완료'} />
                    {profile.vehicle_owned ? <Badge text="차량 보유" /> : null}
                    <Badge text={profile.direct_transport_included ? '직접 운송 포함' : '직접 운송 미포함'} />
                  </div>

                  <h3 className="mt-3 text-2xl font-black">{profile.manager_name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{profile.trust_card_summary}</p>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <RatingBox label="안전" value={formatRating(profile.rating_safety)} />
                    <RatingBox label="친절" value={formatRating(profile.rating_kindness)} />
                    <RatingBox label="정확성" value={formatRating(profile.rating_accuracy)} />
                    <RatingBox label="시간준수" value={formatRating(profile.rating_punctuality)} />
                  </div>

                  {profile.review_summary ? (
                    <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-900">
                      {profile.review_summary}
                    </p>
                  ) : null}

                  <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">
                    {profile.public_notes || '운영실 승인 후 활동 가능한 매니저입니다.'}
                  </p>

                  {profileEvaluations.length > 0 ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <h4 className="font-black">최근 평가</h4>
                      <div className="mt-3 space-y-2">
                        {profileEvaluations.slice(0, 3).map((evaluation) => (
                          <div key={evaluation.id} className="rounded-xl bg-white p-3 text-sm">
                            <div className="font-black">
                              안전 {evaluation.rating_safety} · 친절 {evaluation.rating_kindness} · 정확성 {evaluation.rating_accuracy} · 시간준수 {evaluation.rating_punctuality}
                            </div>
                            {evaluation.public_comment ? <p className="mt-1 text-slate-600">{evaluation.public_comment}</p> : null}
                            {mode === 'ops' ? (
                              <div className="mt-3 flex gap-2">
                                <button onClick={() => updateEvaluation(evaluation.id, 'ops_reviewed')} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                                  검수 완료
                                </button>
                                <button onClick={() => updateEvaluation(evaluation.id, 'hidden')} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                                  숨김
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}

function RatingSelect({ name, label }: { name: string; label: string }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <select name={name} defaultValue="5" className="w-full rounded-2xl border border-slate-200 p-4">
        <option value="5">5점</option>
        <option value="4">4점</option>
        <option value="3">3점</option>
        <option value="2">2점</option>
        <option value="1">1점</option>
      </select>
    </label>
  )
}

function RatingBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center">
      <div className="text-xs font-black text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
      {text}
    </span>
  )
}
