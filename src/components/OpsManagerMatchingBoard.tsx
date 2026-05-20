'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'
import { CarePartnerTrustCard } from '@/components/CarePartnerTrustCard'
import { CareRequestSummaryCard } from '@/components/CareRequestSummaryCard'

type AnyRow = Record<string, any>

type MatchingDashboard = {
  managers: AnyRow[]
  requests: AnyRow[]
  offers: AnyRow[]
  summary: {
    managers: number
    activeRequests: number
    sentOffers: number
    acceptedOffers: number
  }
}

const requestTypes = [
  ['hospital_visit', '병원 안심동행'],
  ['medication_check', '약·복약 확인'],
  ['meal_check', '식사 확인'],
  ['discharge_care', '퇴원 후 안심케어'],
  ['document_help', '서류 챙김']
]

function formatWon(value: number) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

function labelStatus(status: string) {
  const map: Record<string, string> = {
    requested: '요청 접수',
    candidate_generated: '후보 생성',
    offered: '제안 발송',
    assigned: '배정 완료',
    completed: '완료',
    cancelled: '취소'
  }

  return map[status] || status || '요청 접수'
}

function labelOffer(status: string) {
  const map: Record<string, string> = {
    sent: '제안 발송',
    accepted: '수락',
    declined: '거절',
    assigned: '배정',
    cancelled: '취소'
  }

  return map[status] || status || '제안'
}

function managerOfferLink(offer: AnyRow) {
  const base =
    typeof window === 'undefined'
      ? 'https://parents-care.net'
      : window.location.origin

  return `${base}/manager?managerProfileId=${encodeURIComponent(offer.manager_profile_id || '')}`
}

function offerMessage(offer: AnyRow) {
  const snapshot = offer.request_snapshot || {}
  const title = snapshot.request_title || '부모님 안심케어 제안'
  const region = snapshot.region_text || '지역 협의'
  const appointment = snapshot.appointment_time || snapshot.appointment_date || '일정 협의'
  const minutes = offer.estimated_minutes || 90
  const fee = Number(offer.expected_fee || 0).toLocaleString('ko-KR')
  const link = managerOfferLink(offer)

  return [
    '[부모님 안심케어] 새 케어 제안이 도착했습니다.',
    '',
    `내용: ${title}`,
    `지역: ${region}`,
    `일정: ${appointment}`,
    `예상 소요: ${minutes}분`,
    `예상 정산: ${fee}원`,
    '',
    '확인 후 수락/거절해주세요.',
    link
  ].join('\n')
}

export function OpsManagerMatchingBoard() {
  const [data, setData] = useState<MatchingDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [creating, setCreating] = useState(false)

  const [form, setForm] = useState({
    elderName: '어머니',
    guardianName: '',
    guardianPhone: '',
    requestTitle: '병원 안심동행 요청',
    requestType: 'hospital_visit',
    regionText: '',
    hospitalName: '',
    appointmentDate: '',
    appointmentTime: '',
    meetingLocation: '',
    requiredSpecialties: '병원동행, 약국·복약 확인',
    requiredServiceScopes: '접수·수납 도움, 약국 동행, 귀가 확인',
    priority: 'normal'
  })

  const selectedRequest = useMemo(() => {
    return (data?.requests || []).find((item) => item.id === selectedRequestId) || null
  }, [data?.requests, selectedRequestId])

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-matching', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '매칭 정보를 불러오지 못했습니다.')
      }

      setData(result)
      if (!selectedRequestId && result.requests?.[0]?.id) {
        setSelectedRequestId(result.requests[0].id)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매칭 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function postAction(payload: Record<string, unknown>) {
    setCreating(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '처리 중 오류가 발생했습니다.')
      }

      setMessage(result.message || '처리됐습니다.')

      if (result.request?.id) {
        setSelectedRequestId(result.request.id)
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setCreating(false)
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(`${label}를 복사했습니다.`)
    } catch {
      setMessage(`${label}: ${value}`)
    }
  }

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await postAction({
      action: 'create_request',
      ...form
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const managers = data?.managers || []
  const requests = data?.requests || []
  const offers = data?.offers || []
  const requestOffers = selectedRequestId
    ? offers.filter((offer) => offer.matching_request_id === selectedRequestId)
    : []

  return (
    <AppFrame
      title="매니저 매칭 관리"
      subtitle="검증 매니저 풀에서 부모님 안심케어 요청에 맞는 후보를 제안합니다"
      showMobileNav={false}
    >
      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <CareCard tone="green">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill text="운영실" tone="green" />
              <StatusPill text="매칭 MVP" tone="slate" />
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
              매니저 등록부터
              <br />
              후보 매칭까지 연결합니다.
            </h1>
            <p className="mt-4 text-base font-bold leading-7 text-[#4E6D69]">
              매니저가 등록·검증되면 매니저 풀에 들어가고, 운영실은 부모님 안심케어 요청별로 후보를 자동 추천할 수 있습니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <CareButton href="/manager/register">매니저 등록 페이지</CareButton>
              <CareButton href="/manager" tone="dark">매니저 앱 보기</CareButton>
              <button
                type="button"
                onClick={() => postAction({ action: 'create_demo_request' })}
                disabled={creating}
                className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2] disabled:opacity-60"
              >
                데모 요청 만들기
              </button>
            </div>
          </CareCard>

          <section className="grid gap-3 md:grid-cols-4">
            <Stat label="검증 매니저" value={data?.summary.managers || 0} />
            <Stat label="요청" value={data?.summary.activeRequests || 0} />
            <Stat label="제안 발송" value={data?.summary.sentOffers || 0} />
            <Stat label="수락" value={data?.summary.acceptedOffers || 0} />
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
            <h2 className="text-2xl font-black">새 안심케어 요청 만들기</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
              실제 서비스에서는 자녀가 신청한 요청이 자동으로 들어오고, 운영실은 여기서 후보 매니저를 생성합니다.
            </p>

            <form onSubmit={createRequest} className="mt-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="부모님" value={form.elderName} onChange={(value) => update('elderName', value)} placeholder="예: 어머니" />
                <Input label="보호자 이름" value={form.guardianName} onChange={(value) => update('guardianName', value)} placeholder="예: 홍길동" />
                <Input label="보호자 연락처" value={form.guardianPhone} onChange={(value) => update('guardianPhone', value)} placeholder="010-0000-0000" />
                <Input label="지역" value={form.regionText} onChange={(value) => update('regionText', value)} placeholder="예: 강남구" />
              </div>

              <Input label="요청 제목" value={form.requestTitle} onChange={(value) => update('requestTitle', value)} placeholder="예: 강남구 정형외과 병원 안심동행" />

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-[#486B67]">요청 유형</span>
                  <select
                    value={form.requestType}
                    onChange={(event) => update('requestType', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold outline-none focus:border-[#19B99A]"
                  >
                    {requestTypes.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-black text-[#486B67]">우선순위</span>
                  <select
                    value={form.priority}
                    onChange={(event) => update('priority', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold outline-none focus:border-[#19B99A]"
                  >
                    <option value="normal">보통</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input label="병원/장소" value={form.hospitalName} onChange={(value) => update('hospitalName', value)} placeholder="예: 강남안심병원" />
                <Input label="만남 위치" value={form.meetingLocation} onChange={(value) => update('meetingLocation', value)} placeholder="예: 병원 정문" />
                <Input label="예약 날짜" value={form.appointmentDate} onChange={(value) => update('appointmentDate', value)} placeholder="예: 2026-05-20" />
                <Input label="예약 시간" value={form.appointmentTime} onChange={(value) => update('appointmentTime', value)} placeholder="예: 오전 10시" />
              </div>

              <Input label="필요 역량" value={form.requiredSpecialties} onChange={(value) => update('requiredSpecialties', value)} placeholder="예: 병원동행, 약국·복약 확인" />
              <Input label="필요 업무" value={form.requiredServiceScopes} onChange={(value) => update('requiredServiceScopes', value)} placeholder="예: 접수·수납 도움, 약국 동행, 귀가 확인" />

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-3xl bg-[#19B99A] px-6 py-5 text-lg font-black text-white disabled:opacity-60"
              >
                {creating ? '생성 중...' : '안심케어 요청 생성'}
              </button>
            </form>
          </CareCard>
        </div>

        <div className="space-y-5">
          <CareCard tone="white">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black">요청별 매칭</h2>
                <p className="mt-2 text-sm font-bold text-[#607D79]">
                  요청을 선택하고 후보 매니저를 생성하세요.
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
              {requests.length === 0 ? (
                <Empty message="아직 매칭 요청이 없습니다." />
              ) : (
                requests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedRequestId(request.id)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                      (selectedRequestId === request.id
                        ? 'bg-emerald-50 ring-emerald-400'
                        : 'bg-[#F8FCFB] ring-[#E3EFEC] hover:bg-white')
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge text={labelStatus(request.matching_status)} />
                      <Badge text={request.region_text || '지역 미정'} />
                      <Badge text={request.priority || 'normal'} />
                    </div>
                    <div className="mt-3 text-xl font-black">{request.request_title}</div>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                      {request.elder_name || '부모님'} · {request.hospital_name || request.meeting_location || '장소 협의'} · {request.appointment_time || '시간 협의'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CareCard>

          <CareCard tone="green">
            <h2 className="text-2xl font-black">후보 매니저 생성</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#4E6D69]">
              검증 완료 매니저 중 지역·업무·역량이 맞는 사람을 점수화해서 제안합니다.
            </p>

            {selectedRequest ? (
              <div className="mt-4 space-y-3">
                <CareRequestSummaryCard request={selectedRequest} compact />
              </div>
            ) : null}

            <button
              type="button"
              disabled={!selectedRequestId || creating}
              onClick={() => postAction({ action: 'generate_offers', matchingRequestId: selectedRequestId, topN: 5 })}
              className="mt-5 w-full rounded-3xl bg-[#193B38] px-6 py-5 text-lg font-black text-white disabled:opacity-60"
            >
              {creating ? '생성 중...' : '후보 매니저 제안 생성'}
            </button>
          </CareCard>

          <CareCard tone="white">
            <h2 className="text-2xl font-black">제안 결과</h2>
            <div className="mt-5 space-y-3">
              {requestOffers.length === 0 ? (
                <Empty message="아직 이 요청에 생성된 제안이 없습니다." />
              ) : (
                requestOffers.map((offer) => (
                  <div key={offer.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#E3EFEC]">
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelOffer(offer.offer_status)} />
                      <Badge text={`${offer.offer_score || 0}점`} />
                      <Badge text={formatWon(offer.expected_fee)} />
                    </div>
                    <div className="mt-3 text-xl font-black">{offer.manager_name}</div>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                      {offer.manager_phone || '연락처 없음'}
                    </p>

                    <div className="mt-4">
                      <CarePartnerTrustCard offer={offer} compact />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(offer.offer_reasons || []).map((reason: string) => (
                        <span key={reason} className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
                          {reason}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => copyText(managerOfferLink(offer), '제안 링크')}
                        className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
                      >
                        제안 링크 복사
                      </button>

                      <button
                        type="button"
                        onClick={() => copyText(offerMessage(offer), '카톡·문자 문구')}
                        className="rounded-2xl bg-[#EAFBF6] px-4 py-3 text-sm font-black text-[#2F756B] ring-1 ring-[#CFE7E2]"
                      >
                        카톡·문자 문구 복사
                      </button>

                      <Link
                        href={`/manager?managerProfileId=${encodeURIComponent(offer.manager_profile_id || '')}`}
                        className="rounded-2xl bg-[#193B38] px-4 py-3 text-center text-sm font-black text-white"
                      >
                        매니저 화면 열기
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CareCard>

          <CareCard tone="white">
            <h2 className="text-2xl font-black">검증 매니저 풀</h2>
            <div className="mt-5 space-y-3">
              {managers.length === 0 ? (
                <div className="space-y-3">
                  <Empty message="아직 검증 완료 매니저가 없습니다." />
                  <Link href="/manager/register" className="block rounded-2xl bg-[#19B99A] px-5 py-4 text-center font-black text-white">
                    매니저 등록 받기
                  </Link>
                </div>
              ) : (
                managers.map((manager) => (
                  <div key={manager.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#E3EFEC]">
                    <div className="text-xl font-black">{manager.manager_name}</div>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                      {(manager.available_regions || []).join(', ') || '지역 미정'} · {(manager.specialties || []).join(', ') || '역량 미정'}
                    </p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#718A87]">
                      {manager.trust_card_summary || '검증 완료 매니저'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CareCard>
        </div>
      </section>
    </AppFrame>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#486B67]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold outline-none focus:border-[#19B99A]"
      />
    </label>
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
