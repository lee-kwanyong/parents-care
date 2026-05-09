'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  buildManagerMatchingSummary,
  labelMatchingRequestType,
  labelMatchingStatus,
  labelTrustLevel,
  matchingRequestTypeOptions,
  type ManagerMatchingCandidate,
  type ManagerMatchingRequest,
  type VerifiedManagerProfile
} from '@/lib/manager-matching-engine'

const specialtyExamples = [
  '정형외과',
  '내과',
  '안과',
  '재활·물리치료',
  '약국·복약 확인',
  '서류·보험서류',
  '휠체어 이동 보조',
  '청력·의사소통 보조'
]

const serviceScopeExamples = [
  '병원 앞 만남',
  '집 앞 만남 후 택시 동행',
  '접수·수납 도움',
  '진료실 동행',
  '약국 동행',
  '서류 수령',
  '보호자 질문 전달',
  '30초 리포트 작성',
  '복약 확인',
  '귀가 확인'
]

function toggle(current: string[], value: string) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
}

export function ManagerMatchingBoard() {
  const [requests, setRequests] = useState<ManagerMatchingRequest[]>([])
  const [candidates, setCandidates] = useState<ManagerMatchingCandidate[]>([])
  const [profiles, setProfiles] = useState<VerifiedManagerProfile[]>([])
  const [requiredSpecialties, setRequiredSpecialties] = useState<string[]>(['정형외과'])
  const [requiredServiceScopes, setRequiredServiceScopes] = useState<string[]>(['병원 앞 만남', '접수·수납 도움', '약국 동행'])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-matching', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '매니저 매칭 정보를 불러오지 못했습니다.')
      }

      setRequests(data.requests || [])
      setCandidates(data.candidates || [])
      setProfiles(data.profiles || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매니저 매칭 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/manager-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_request',
          elderName: formData.get('elderName'),
          guardianName: formData.get('guardianName'),
          guardianPhone: formData.get('guardianPhone'),
          requestTitle: formData.get('requestTitle'),
          requestType: formData.get('requestType'),
          regionText: formData.get('regionText'),
          hospitalName: formData.get('hospitalName'),
          appointmentDate: formData.get('appointmentDate'),
          appointmentTime: formData.get('appointmentTime'),
          meetingLocation: formData.get('meetingLocation'),
          requiredSpecialties,
          requiredServiceScopes,
          mobilitySupportNeeded: formData.get('mobilitySupportNeeded') === 'on',
          hearingSupportNeeded: formData.get('hearingSupportNeeded') === 'on',
          allergyAttentionNeeded: formData.get('allergyAttentionNeeded') === 'on',
          medicationAttentionNeeded: formData.get('medicationAttentionNeeded') === 'on',
          transportMode: formData.get('transportMode'),
          vehicleRequired: formData.get('vehicleRequired') === 'on',
          directTransportRequired: false,
          priority: formData.get('priority'),
          opsMemo: formData.get('opsMemo')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '매칭 요청 생성 실패')
      }

      setMessage('매니저 매칭 요청이 생성됐습니다.')
      form.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매칭 요청 생성 실패')
    }
  }

  async function actionRequest(action: string, requestId: string, profileId?: string) {
    setMessage('')

    try {
      const response = await fetch('/api/manager-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, requestId, profileId })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '처리 실패')
      }

      if (action === 'generate_candidates') setMessage(`후보 ${data.inserted || 0}명이 생성됐습니다.`)
      if (action === 'select_candidate') setMessage('매니저 후보를 선택했습니다.')
      if (action === 'assign_selected') setMessage('검증된 매니저로 현장 배정을 생성했습니다.')

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildManagerMatchingSummary(requests, candidates, profiles), [requests, candidates, profiles])

  const candidatesByRequest = useMemo(() => {
    const map = new Map<string, ManagerMatchingCandidate[]>()

    for (const candidate of candidates) {
      const current = map.get(candidate.matching_request_id) || []
      current.push(candidate)
      map.set(candidate.matching_request_id, current)
    }

    return map
  }, [candidates])

  const profileMap = useMemo(() => {
    const map = new Map<string, VerifiedManagerProfile>()
    for (const profile of profiles) map.set(profile.id, profile)
    return map
  }, [profiles])

  return (
    <div>
      <section
        className={
          'rounded-3xl p-6 shadow-sm ' +
          (summary.reassuranceState === '안심' ? 'bg-emerald-50' : 'bg-amber-50')
        }
      >
        <p className="text-sm font-black text-[#63807C]">검증 매니저 매칭판</p>
        <h2 className="mt-2 text-5xl font-black">{summary.reassuranceState}</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="매칭 요청" value={summary.requestTotal} />
          <Stat label="후보 생성 필요" value={summary.requestedTotal} />
          <Stat label="선택 필요" value={summary.candidateGeneratedTotal} />
          <Stat label="배정 필요" value={summary.matchedTotal} />
          <Stat label="검증 매니저" value={summary.verifiedProfileTotal} />
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
        <button onClick={load} className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <form onSubmit={createRequest} className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">검증 매니저 매칭 요청 만들기</h2>
        <p className="mt-2 text-sm leading-6 text-[#63807C]">
          본인확인 완료, 활동 중, 직접 운송 미포함 매니저만 후보로 생성됩니다.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <input name="elderName" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="부모님" defaultValue="어머니" />
          <input name="guardianName" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="보호자 이름" />
          <input name="guardianPhone" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="010-1234-5678" />
          <input name="requestTitle" className="rounded-2xl border border-[#E0EFEC] p-4 md:col-span-2" placeholder="예: 어머니 정형외과 병원동행" defaultValue="어머니 병원동행 매칭" />
          <select name="requestType" className="rounded-2xl border border-[#E0EFEC] p-4">
            {matchingRequestTypeOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <input name="regionText" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="지역 예: 서울 강남구" />
          <input name="hospitalName" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="병원명" />
          <input name="appointmentDate" className="rounded-2xl border border-[#E0EFEC] p-4" type="date" />
          <input name="appointmentTime" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="예: 오전 9시" />
          <input name="meetingLocation" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="예: 병원 정문" />
          <select name="priority" className="rounded-2xl border border-[#E0EFEC] p-4">
            <option value="normal">보통</option>
            <option value="high">중요</option>
            <option value="urgent">긴급</option>
            <option value="low">낮음</option>
          </select>
        </div>

        <section className="mt-5 rounded-3xl bg-slate-50 p-5">
          <h3 className="text-xl font-black">필요 전문분야</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            {specialtyExamples.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRequiredSpecialties(toggle(requiredSpecialties, item))}
                className={
                  'rounded-2xl border p-3 text-left text-sm font-black ' +
                  (requiredSpecialties.includes(item)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-[#E0EFEC] bg-white')
                }
              >
                {item}
              </button>
            ))}
          </div>

          <h3 className="mt-5 text-xl font-black">필요 업무</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            {serviceScopeExamples.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRequiredServiceScopes(toggle(requiredServiceScopes, item))}
                className={
                  'rounded-2xl border p-3 text-left text-sm font-black ' +
                  (requiredServiceScopes.includes(item)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-[#E0EFEC] bg-white')
                }
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-3xl bg-amber-50 p-5">
          <h3 className="text-xl font-black text-amber-950">이동 방식과 차량 정책</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
            차량 보유 여부는 참고 정보입니다. 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select name="transportMode" className="rounded-2xl border border-amber-200 bg-white p-4">
              <option value="hospital_meet">병원 앞 만남</option>
              <option value="home_meet_taxi_companion">집 앞 만남 후 택시 동행</option>
              <option value="mobility_partner">이동지원 제휴</option>
              <option value="guardian_arranged">보호자 이동 준비</option>
              <option value="no_transport">이동 없음</option>
            </select>

            <label className="flex items-start gap-3 rounded-2xl bg-white p-4">
              <input name="vehicleRequired" type="checkbox" className="mt-1 h-5 w-5" />
              <span className="text-sm font-bold leading-6">차량 보유 매니저를 우선 참고</span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl bg-white p-4">
              <input name="mobilitySupportNeeded" type="checkbox" className="mt-1 h-5 w-5" />
              <span className="text-sm font-bold leading-6">이동 보조 필요</span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl bg-white p-4">
              <input name="hearingSupportNeeded" type="checkbox" className="mt-1 h-5 w-5" />
              <span className="text-sm font-bold leading-6">청력·설명 보조 필요</span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl bg-white p-4">
              <input name="allergyAttentionNeeded" type="checkbox" className="mt-1 h-5 w-5" />
              <span className="text-sm font-bold leading-6">알러지 주의 필요</span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl bg-white p-4">
              <input name="medicationAttentionNeeded" type="checkbox" className="mt-1 h-5 w-5" />
              <span className="text-sm font-bold leading-6">복용약 확인 필요</span>
            </label>
          </div>
        </section>

        <textarea name="opsMemo" rows={3} className="mt-5 w-full rounded-2xl border border-[#E0EFEC] p-4" placeholder="운영실 메모" />

        <button className="mt-4 w-full rounded-3xl bg-[#8CCFC3] px-6 py-5 text-xl font-black text-[#2E504D]">
          매칭 요청 만들기
        </button>
      </form>

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            매칭 정보를 불러오는 중...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 매칭 요청이 없습니다.</div>
          </div>
        ) : (
          requests.map((request) => {
            const requestCandidates = (candidatesByRequest.get(request.id) || []).sort((a, b) => b.match_score - a.match_score)
            const selectedProfile = request.selected_manager_profile_id ? profileMap.get(request.selected_manager_profile_id) : null

            return (
              <article key={request.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelMatchingRequestType(request.request_type)} />
                      <Badge text={labelMatchingStatus(request.matching_status)} />
                      <Badge text={request.priority} />
                      {selectedProfile ? <Badge text={`선택: ${selectedProfile.manager_name}`} /> : null}
                    </div>

                    <h3 className="mt-3 text-3xl font-black">{request.request_title}</h3>
                    <p className="mt-2 text-sm text-[#63807C]">
                      {request.elder_name} · {request.region_text || '지역 미입력'} · {request.hospital_name || '병원 미입력'}
                    </p>

                    <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                      검증된 매니저만 후보로 생성됩니다. 본인확인 미완료, 보류, 활동중지, 직접 운송 포함 매니저는 제외됩니다.
                    </p>
                  </div>

                  <div className="grid min-w-[190px] gap-2">
                    <button onClick={() => actionRequest('generate_candidates', request.id)} className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]">
                      후보 생성
                    </button>
                    <button onClick={() => actionRequest('assign_selected', request.id)} className="rounded-2xl bg-[#5F7C92] px-4 py-3 font-black text-[#2E504D]">
                      선택 매니저 배정
                    </button>
                  </div>
                </div>

                <section className="mt-6 rounded-3xl bg-slate-50 p-5">
                  <h4 className="text-xl font-black">추천 후보</h4>

                  {requestCandidates.length === 0 ? (
                    <p className="mt-3 text-sm text-[#7A9692]">아직 생성된 후보가 없습니다.</p>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {requestCandidates.map((candidate) => {
                        const profile = profileMap.get(candidate.manager_profile_id)

                        return (
                          <div key={candidate.id} className="rounded-3xl bg-white p-5">
                            <div className="flex flex-wrap gap-2">
                              <Badge text={`${candidate.match_score}점`} />
                              <Badge text={candidate.candidate_status} />
                              {profile ? <Badge text={labelTrustLevel(profile.trust_level)} /> : null}
                              {profile?.identity_verified ? <Badge text="본인확인 완료" /> : null}
                            </div>

                            <h5 className="mt-3 text-2xl font-black">{profile?.manager_name || '매니저'}</h5>
                            <p className="mt-2 text-sm leading-6 text-[#63807C]">{profile?.trust_card_summary || '신뢰카드 정보 없음'}</p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {(candidate.score_reasons || []).map((reason) => (
                                <span key={reason} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                                  {reason}
                                </span>
                              ))}
                            </div>

                            <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">
                              차량 보유는 참고 정보입니다. 직접 유상운송은 기본 서비스에 포함되지 않습니다.
                            </p>

                            <button
                              onClick={() => actionRequest('select_candidate', request.id, candidate.manager_profile_id)}
                              className="mt-4 w-full rounded-2xl bg-[#5F7C92] px-4 py-3 font-black text-[#2E504D]"
                            >
                              이 매니저 선택
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#4E6D69]">
      {text}
    </span>
  )
}
