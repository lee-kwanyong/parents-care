'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'
import { CareRequestSummaryCard } from '@/components/CareRequestSummaryCard'

type AnyRow = Record<string, any>

type IntakeDashboard = {
  intakes: AnyRow[]
  matchingRequests: AnyRow[]
  summary: {
    total: number
    received: number
    reviewing: number
    matchingRequested: number
    completed: number
    highPriority: number
  }
}

const requestTypes = [
  ['hospital_visit', '병원 안심동행'],
  ['medication_check', '약·복약 확인'],
  ['meal_check', '식사 확인'],
  ['discharge_care', '퇴원 후 안심케어'],
  ['document_help', '서류 챙김']
]

function labelStatus(status: string) {
  const map: Record<string, string> = {
    received: '신규 접수',
    reviewing: '운영 확인 중',
    matching_requested: '매칭 요청 전환',
    completed: '처리 완료',
    cancelled: '취소'
  }

  return map[status] || status || '신규 접수'
}

function labelPriority(priority: string) {
  const map: Record<string, string> = {
    high: '높음',
    normal: '보통',
    low: '낮음',
    urgent: '긴급'
  }

  return map[priority] || priority || '보통'
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

function inferTypeFromText(item: AnyRow) {
  const raw = [item.summary_title, item.worry_type, item.raw_text].filter(Boolean).join(' ')

  if (/퇴원|회복|수술 후|낙상|통증/.test(raw)) return 'discharge_care'
  if (/서류|보험|영수증|처방전|세부내역서|통원/.test(raw)) return 'document_help'
  if (/밥|식사|끼니|도시락|반찬/.test(raw)) return 'meal_check'
  if (/약|복용|복약|약봉투|처방/.test(raw)) return 'medication_check'

  return 'hospital_visit'
}

function defaultTitle(item: AnyRow) {
  if (item.summary_title) return item.summary_title

  return `${item.elder_name || '부모님'} 안심케어 접수`
}

export function OpsIntakeBoard() {
  const [data, setData] = useState<IntakeDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [working, setWorking] = useState(false)
  const [form, setForm] = useState({
    requestTitle: '',
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

  const selected = useMemo(() => {
    return (data?.intakes || []).find((item) => item.id === selectedId) || null
  }, [data?.intakes, selectedId])

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops-intake', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '운영실 접수함을 불러오지 못했습니다.')
      }

      setData(result)

      if (!selectedId && result.intakes?.[0]) {
        selectIntake(result.intakes[0])
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '운영실 접수함을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function selectIntake(item: AnyRow) {
    const requestType = inferTypeFromText(item)

    setSelectedId(item.id)
    setForm({
      requestTitle: defaultTitle(item),
      requestType,
      regionText: '',
      hospitalName: '',
      appointmentDate: '',
      appointmentTime: '',
      meetingLocation: '',
      requiredSpecialties:
        requestType === 'medication_check'
          ? '복약 확인, 약국·복약 확인'
          : requestType === 'meal_check'
            ? '식사 확인, 생활 안심케어'
            : requestType === 'discharge_care'
              ? '퇴원 후 안심케어, 복약 확인, 식사 확인'
              : requestType === 'document_help'
                ? '서류 챙김, 보험서류 정리'
                : '병원동행, 약국·복약 확인',
      requiredServiceScopes:
        requestType === 'medication_check'
          ? '복약 확인, 약 봉투 확인, 자녀 알림'
          : requestType === 'meal_check'
            ? '식사 확인, 자녀 알림'
            : requestType === 'discharge_care'
              ? '퇴원 후 상태 확인, 약 확인, 식사 확인, 다음 외래 확인'
              : requestType === 'document_help'
                ? '영수증 확인, 처방전 확인, 보험서류 정리'
                : '접수·수납 도움, 약국 동행, 귀가 확인',
      priority: item.priority || 'normal'
    })
  }

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function postAction(payload: Record<string, unknown>) {
    setWorking(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '처리 중 오류가 발생했습니다.')
      }

      setMessage(result.message || '처리됐습니다.')

      if (result.intake?.id) {
        setSelectedId(result.intake.id)
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setWorking(false)
    }
  }

  async function convertToMatching(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selected) return

    const submitter = (event.nativeEvent as any).submitter as HTMLButtonElement | null
    const generateOffers = submitter?.value === 'with_offers'

    await postAction({
      action: 'create_matching_request',
      intakeId: selected.id,
      generateOffers,
      topN: 5,
      ...form
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const intakes = data?.intakes || []
  const summary = data?.summary || {
    total: 0,
    received: 0,
    reviewing: 0,
    matchingRequested: 0,
    completed: 0,
    highPriority: 0
  }

  return (
    <AppFrame
      title="운영실 접수함"
      subtitle="신규 안심케어 신청을 확인하고 매칭으로 전환합니다"
      showMobileNav={false}
    >
      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <CareCard tone="green">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill text="운영실" tone="green" />
              <StatusPill text="접수함" tone="slate" />
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
              보호자 신청을
              <br />
              매칭 가능한 요청으로 정리합니다.
            </h1>

            <p className="mt-4 text-base font-bold leading-7 text-[#4E6D69]">
              안심케어 시작하기에서 들어온 신청을 확인하고, 필요한 정보를 보완한 뒤 매칭 요청과 후보 매니저 제안까지 한 번에 생성합니다.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={load}
                className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
              >
                새로고침
              </button>
              <button
                type="button"
                onClick={() => postAction({ action: 'create_demo_intake' })}
                disabled={working}
                className="rounded-3xl bg-[#247A71] px-5 py-4 font-black text-white disabled:opacity-60"
              >
                데모 접수 만들기
              </button>
              <CareButton href="/admin/ops/matching" tone="dark">
                매칭관리로 이동
              </CareButton>
            </div>
          </CareCard>

          <section className="grid gap-3 md:grid-cols-3">
            <Stat label="전체 접수" value={summary.total} />
            <Stat label="신규" value={summary.received} />
            <Stat label="확인 중" value={summary.reviewing} />
            <Stat label="매칭 전환" value={summary.matchingRequested} />
            <Stat label="처리 완료" value={summary.completed} />
            <Stat label="우선 확인" value={summary.highPriority} />
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">신규 안심케어 신청</h2>
                <p className="mt-2 text-sm font-bold text-[#607D79]">
                  접수 건을 선택하면 오른쪽에서 매칭 요청으로 전환할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {intakes.length === 0 ? (
                <Empty message="아직 접수된 안심케어 신청이 없습니다." />
              ) : (
                intakes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectIntake(item)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                      (selectedId === item.id
                        ? 'bg-emerald-50 ring-emerald-400'
                        : 'bg-[#FAFFFD] ring-[#E3EFEC] hover:bg-white')
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelStatus(item.status)} />
                      <Badge text={labelPriority(item.priority)} />
                      <Badge text={item.channel || 'memo'} />
                      {item.social_care_requested ? <Badge text="복지지원 요청" /> : null}
                    </div>

                    <div className="mt-3 text-xl font-black">
                      {item.summary_title || `${item.elder_name || '부모님'} 안심케어 신청`}
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-[#607D79]">
                      {item.raw_text || '상황 메모 없음'}
                    </p>

                    <p className="mt-2 text-xs font-bold text-[#8AA29E]">
                      {item.contact_name || '보호자'} · {item.contact_phone || '연락처 없음'} · {formatDate(item.created_at)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CareCard>
        </div>

        <div className="space-y-5">
          {!selected ? (
            <CareCard tone="white">
              <Empty message="왼쪽에서 접수 건을 선택하세요." />
            </CareCard>
          ) : (
            <>
              <CareCard tone="white">
                <div className="flex flex-wrap gap-2">
                  <StatusPill text="선택한 접수" tone="green" />
                  <StatusPill text={labelStatus(selected.status)} tone="slate" />
                  <StatusPill text={labelPriority(selected.priority)} tone="blue" />
                </div>

                <h2 className="mt-4 text-3xl font-black">
                  {selected.summary_title || `${selected.elder_name || '부모님'} 안심케어 신청`}
                </h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Info label="부모님" value={selected.elder_name || '부모님'} />
                  <Info label="보호자" value={selected.contact_name || '-'} />
                  <Info label="연락처" value={selected.contact_phone || '-'} />
                  <Info label="접수채널" value={selected.channel || '-'} />
                </div>

                <div className="mt-5">
                  <CareRequestSummaryCard intake={selected} compact />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => postAction({ action: 'update_status', intakeId: selected.id, status: 'reviewing' })}
                    disabled={working}
                    className="rounded-2xl bg-[#DCEFF7] px-4 py-3 text-sm font-black text-[#365E78] disabled:opacity-60"
                  >
                    운영 확인 중
                  </button>
                  <button
                    type="button"
                    onClick={() => postAction({ action: 'update_status', intakeId: selected.id, status: 'completed' })}
                    disabled={working}
                    className="rounded-2xl bg-[#EAFBF6] px-4 py-3 text-sm font-black text-[#2F756B] disabled:opacity-60"
                  >
                    처리 완료
                  </button>
                  <button
                    type="button"
                    onClick={() => postAction({ action: 'update_status', intakeId: selected.id, status: 'received', priority: 'high' })}
                    disabled={working}
                    className="rounded-2xl bg-[#FFF5DF] px-4 py-3 text-sm font-black text-[#886B35] disabled:opacity-60"
                  >
                    우선 확인
                  </button>
                </div>
              </CareCard>

              <CareCard tone="green">
                <h2 className="text-2xl font-black">매칭 요청으로 전환</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4E6D69]">
                  매니저가 찾을 수 있도록 지역, 장소, 요청 유형을 정리한 뒤 매칭 요청으로 넘깁니다.
                </p>

                <form onSubmit={convertToMatching} className="mt-5 space-y-4">
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
                    <Input label="지역" value={form.regionText} onChange={(value) => update('regionText', value)} placeholder="예: 강남구" />
                    <Input label="병원/장소" value={form.hospitalName} onChange={(value) => update('hospitalName', value)} placeholder="예: 강남안심병원" />
                    <Input label="예약 날짜" value={form.appointmentDate} onChange={(value) => update('appointmentDate', value)} placeholder="예: 2026-05-20" />
                    <Input label="예약 시간" value={form.appointmentTime} onChange={(value) => update('appointmentTime', value)} placeholder="예: 오전 10시" />
                  </div>

                  <Input label="만남 위치" value={form.meetingLocation} onChange={(value) => update('meetingLocation', value)} placeholder="예: 병원 정문" />
                  <Input label="필요 역량" value={form.requiredSpecialties} onChange={(value) => update('requiredSpecialties', value)} placeholder="예: 병원동행, 약국·복약 확인" />
                  <Input label="필요 업무" value={form.requiredServiceScopes} onChange={(value) => update('requiredServiceScopes', value)} placeholder="예: 접수·수납 도움, 약국 동행, 귀가 확인" />

                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="submit"
                      value="request_only"
                      disabled={working}
                      className="rounded-3xl bg-white px-6 py-5 text-lg font-black text-[#426C68] ring-1 ring-[#CFE7E2] disabled:opacity-60"
                    >
                      {working ? '전환 중...' : '매칭 요청만 만들기'}
                    </button>

                    <button
                      type="submit"
                      value="with_offers"
                      disabled={working}
                      className="rounded-3xl bg-[#19B99A] px-6 py-5 text-lg font-black text-white disabled:opacity-60"
                    >
                      {working ? '후보 생성 중...' : '매칭 요청 만들고 후보 생성'}
                    </button>
                  </div>

                  <Link
                    href="/admin/ops/matching"
                    className="block rounded-3xl bg-white px-6 py-5 text-center text-lg font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
                  >
                    매칭관리에서 자세히 보기
                  </Link>
                </form>
              </CareCard>
            </>
          )}
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#E3EFEC]">
      <div className="text-xs font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-base font-black">{value}</div>
    </div>
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
