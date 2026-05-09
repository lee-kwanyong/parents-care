'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildManagerOnboardingSummary,
  labelApplicationStatus,
  labelManagerType,
  labelTrustLevel,
  type CareManagerApplication,
  type CareManagerProfile,
  type CareManagerScreeningEvent,
  type ManagerApplicationStatus
} from '@/lib/manager-onboarding-engine'

export function ManagerOnboardingBoard({ mode = 'ops' }: { mode?: 'ops' | 'family' }) {
  const [applications, setApplications] = useState<CareManagerApplication[]>([])
  const [profiles, setProfiles] = useState<CareManagerProfile[]>([])
  const [events, setEvents] = useState<CareManagerScreeningEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-onboarding', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '매니저 등록 정보를 불러오지 못했습니다.')
      }

      setApplications(data.applications || [])
      setProfiles(data.profiles || [])
      setEvents(data.events || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매니저 등록 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: ManagerApplicationStatus) {
    setMessage('')

    let trustLevel = 'basic'
    let opsMemo = ''
    let rejectionReason = ''

    if (status === 'approved') {
      trustLevel = window.prompt('신뢰등급을 입력해주세요. basic / standard / trusted', 'standard') || 'standard'
      opsMemo = window.prompt('승인 메모를 입력해주세요.', '운영실 심사 승인') || '운영실 심사 승인'
    }

    if (status === 'rejected') {
      rejectionReason = window.prompt('반려 사유를 입력해주세요.', '심사 기준 미충족') || '심사 기준 미충족'
    }

    try {
      const response = await fetch('/api/manager-onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          trustLevel,
          opsMemo,
          rejectionReason
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildManagerOnboardingSummary(applications, profiles), [applications, profiles])

  const eventsByApplication = useMemo(() => {
    const map = new Map<string, CareManagerScreeningEvent[]>()

    for (const event of events) {
      if (!event.manager_application_id) continue
      const current = map.get(event.manager_application_id) || []
      current.push(event)
      map.set(event.manager_application_id, current)
    }

    return map
  }, [events])

  return (
    <div>
      <section
        className={
          'rounded-3xl p-6 shadow-sm ' +
          (summary.reassuranceState === '안심' ? 'bg-emerald-50' : 'bg-amber-50')
        }
      >
        <p className="text-sm font-black text-[#63807C]">매니저 등록 안심판</p>
        <h2 className="mt-2 text-5xl font-black">{summary.reassuranceState}</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="지원서" value={summary.applicationTotal} />
          <Stat label="심사 필요" value={summary.waitingReviewTotal} />
          <Stat label="면접" value={summary.interviewTotal} />
          <Stat label="교육 확인" value={summary.trainingTotal} />
          <Stat label="활동 매니저" value={summary.activeProfileTotal} />
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

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            매니저 지원서를 불러오는 중...
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 매니저 지원서가 없습니다.</div>
            <p className="mt-2 text-[#7A9692]">/manager/apply 에서 지원서를 만들어보세요.</p>
          </div>
        ) : (
          applications.map((application) => {
            const appEvents = eventsByApplication.get(application.id) || []

            return (
              <article key={application.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelApplicationStatus(application.application_status)} />
                      <Badge text={labelManagerType(application.manager_type)} />
                      <Badge text={labelTrustLevel(application.trust_level)} />
                      {application.vehicle_owned ? <Badge text="차량 보유" /> : null}
                      <Badge text={application.direct_transport_included ? '직접 운송 포함' : '직접 운송 미포함'} />
                    </div>

                    <h3 className="mt-3 text-3xl font-black">{application.applicant_name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#63807C]">
                      {application.applicant_phone} · 경력 {application.career_years || 0}년 · {application.address_text || '주소 미입력'}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <InfoBox title="자격·교육" items={application.certifications || []} />
                      <InfoBox title="가능지역" items={application.available_regions || []} />
                      <InfoBox title="전문분야" items={application.specialties || []} />
                      <InfoBox title="디지털 활용" items={application.digital_skills || []} />
                    </div>

                    <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                      차량 보유 여부는 참고 정보입니다. 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.
                      기본 이동은 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴 기준입니다.
                    </p>

                    {application.career_summary ? (
                      <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-[#4E6D69]">
                        {application.career_summary}
                      </p>
                    ) : null}

                    {appEvents.length > 0 ? (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <h4 className="font-black">심사 기록</h4>
                        <div className="mt-2 space-y-2">
                          {appEvents.slice(0, 5).map((event) => (
                            <div key={event.id} className="rounded-xl bg-white p-3 text-sm">
                              <div className="font-black">{event.title}</div>
                              {event.description ? <p className="mt-1 text-[#63807C]">{event.description}</p> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {mode === 'ops' ? (
                    <div className="grid min-w-[190px] gap-2">
                      <button onClick={() => updateStatus(application.id, 'document_review')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                        서류 검토
                      </button>
                      <button onClick={() => updateStatus(application.id, 'interview_scheduled')} className="rounded-2xl bg-blue-50 px-4 py-3 font-black text-blue-900">
                        면접 예정
                      </button>
                      <button onClick={() => updateStatus(application.id, 'training_pending')} className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-900">
                        교육 확인
                      </button>
                      <button onClick={() => updateStatus(application.id, 'approved')} className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]">
                        승인·신뢰카드 생성
                      </button>
                      <button onClick={() => updateStatus(application.id, 'waitlisted')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                        대기 등록
                      </button>
                      <button onClick={() => updateStatus(application.id, 'rejected')} className="rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700">
                        반려
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-3xl font-black">매니저 신뢰카드</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {profiles.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm md:col-span-2">
              <div className="text-xl font-black">아직 승인된 매니저가 없습니다.</div>
            </div>
          ) : (
            profiles.map((profile) => (
              <article key={profile.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge text={labelTrustLevel(profile.trust_level)} />
                  <Badge text={profile.profile_status} />
                  {profile.vehicle_owned ? <Badge text="차량 보유" /> : null}
                  <Badge text={profile.direct_transport_included ? '직접 운송 포함' : '직접 운송 미포함'} />
                </div>

                <h3 className="mt-3 text-2xl font-black">{profile.manager_name}</h3>
                <p className="mt-2 text-sm text-[#63807C]">{profile.trust_card_summary}</p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InfoBox title="가능지역" items={profile.available_regions || []} />
                  <InfoBox title="전문분야" items={profile.specialties || []} />
                </div>

                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-[#4E6D69]">
                  {profile.public_notes || '운영실 승인 후 활동 가능한 매니저입니다.'}
                </p>
              </article>
            ))
          )}
        </div>
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

function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <h4 className="font-black">{title}</h4>
      <div className="mt-2 space-y-1">
        {items.length > 0 ? (
          items.map((item) => (
            <p key={item} className="text-sm leading-6 text-[#4E6D69]">
              • {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-[#7A9692]">미입력</p>
        )}
      </div>
    </div>
  )
}
