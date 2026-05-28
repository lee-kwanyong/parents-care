'use client'

import { useEffect, useMemo, useState } from 'react'
import { careRequestTypes, partnerVerificationStatuses, statusLabel } from '@/lib/anbu-partner-matching'

type Partner = {
  id?: string
  applicant_name?: string
  phone?: string
  region?: string
  available_time?: string
  verification_status?: string
  has_caregiver_license?: boolean
  can_hospital_accompany?: boolean
  can_medication_check?: boolean
  can_meal_check?: boolean
  can_drive?: boolean
  memo?: string
  created_at?: string
  matchScore?: number
  matchReasons?: string[]
}

type CareRequest = {
  id?: string
  family_code?: string
  guardian_name?: string
  guardian_phone?: string
  parent_name?: string
  region?: string
  request_type?: string
  preferred_date?: string
  preferred_time?: string
  details?: string
  status?: string
}

function parseMemo(value?: string) {
  if (!value) return {}

  try {
    return JSON.parse(value)
  } catch {
    return { memo: value }
  }
}

function toFormObject(form: HTMLFormElement) {
  const data = new FormData(form)
  return Object.fromEntries(data.entries())
}

export function CarePartnerApplyScreen() {
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const payload = toFormObject(event.currentTarget)

    const response = await fetch('/api/anbu-partners/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await response.json().catch(() => ({}))
    setResult(data)

    if (data.ok) {
      event.currentTarget.reset()
    }

    setLoading(false)
  }

  return (
    <PageShell
      eyebrow="케어파트너 신청"
      title="요양보호사·병원동행·생활확인 파트너를 모집합니다."
      desc="활동 지역과 가능 업무를 등록하면 운영실이 검토 후 승인합니다. 의료행위가 아닌 안부확인·생활확인·병원동행 중심입니다."
    >
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="이름" name="applicantName" required />
          <Input label="연락처" name="phone" required />
          <Input label="이메일" name="email" />
          <Input label="활동 가능 지역" name="region" placeholder="예: 청주, 강남, 송파" required />
          <Input label="가능 요일/시간" name="availableTime" placeholder="예: 평일 오전, 주말 가능" />
          <Input label="희망 활동비" name="expectedFee" placeholder="예: 시간당 15,000원" />

          <Check name="hasCaregiverLicense" label="요양보호사 자격 있음" />
          <Check name="canHospitalAccompany" label="병원동행 가능" />
          <Check name="canMedicationCheck" label="복약확인 가능" />
          <Check name="canMealCheck" label="식사확인 가능" />
          <Check name="canDrive" label="차량 이동 가능" />

          <div className="md:col-span-2">
            <TextArea label="자기소개 / 활동 경험" name="intro" placeholder="요양보호, 병원동행, 돌봄 활동 경험을 적어주세요." />
          </div>

          <div className="md:col-span-2">
            <TextArea label="추가 메모" name="experience" placeholder="희망 지역, 가능한 업무 범위, 자격증 정보 등" />
          </div>

          <label className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8] md:col-span-2">
            <input type="checkbox" required className="mr-2" />
            개인정보 수집 및 케어파트너 검증 목적 이용에 동의합니다.
          </label>

          <button
            disabled={loading}
            className="rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-60 md:col-span-2"
          >
            {loading ? '접수 중...' : '케어파트너 신청하기'}
          </button>
        </form>
      </section>

      {result ? <ResultBox result={result} /> : null}
    </PageShell>
  )
}

export function OpsPartnersScreen() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)

    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    const response = await fetch('/api/anbu-partners/list' + query, { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))

    setPartners(Array.isArray(data.partners) ? data.partners : [])
    setResult(data)
    setLoading(false)
  }

  async function verify(id: string, nextStatus: string, memo = '') {
    setLoading(true)

    const response = await fetch('/api/anbu-partners/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus, memo })
    })

    const data = await response.json().catch(() => ({}))
    setResult(data)
    await load()
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const summary = useMemo(() => {
    return {
      total: partners.length,
      approved: partners.filter((item) => ['approved', 'active'].includes(item.verification_status || '')).length,
      newCount: partners.filter((item) => !item.verification_status || item.verification_status === 'new').length
    }
  }, [partners])

  return (
    <PageShell
      eyebrow="운영실 · 케어파트너"
      title="신청자를 검토하고 활동 가능 파트너로 승인합니다."
      desc="요양보호사, 병원동행매니저, 생활확인 파트너를 운영실에서 승인/보류/거절하고 보호자 요청에 추천합니다."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Summary label="전체" value={summary.total} />
        <Summary label="신규" value={summary.newCount} />
        <Summary label="승인/활동" value={summary.approved} />
      </div>

      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.05em]">파트너 신청 목록</h2>
            <p className="mt-2 text-sm font-bold text-[#637B76]">상태별로 검토하고 승인 처리하세요.</p>
          </div>

          <div className="flex gap-2">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
            >
              <option value="">전체</option>
              {partnerVerificationStatuses.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>

            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              새로고침
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {partners.length === 0 ? (
            <p className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
              표시할 파트너가 없습니다.
            </p>
          ) : (
            partners.map((partner) => {
              const memo = parseMemo(partner.memo)

              return (
                <article key={partner.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                  <div className="flex flex-wrap gap-2">
                    <Badge text={statusLabel(partner.verification_status || 'new')} />
                    <Badge text={partner.region || '-'} />
                    {partner.has_caregiver_license ? <Badge text="요양보호사" /> : null}
                    {partner.can_hospital_accompany ? <Badge text="병원동행" /> : null}
                    {partner.can_medication_check ? <Badge text="복약확인" /> : null}
                    {partner.can_meal_check ? <Badge text="식사확인" /> : null}
                    {partner.can_drive ? <Badge text="차량가능" /> : null}
                  </div>

                  <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{partner.applicant_name}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                    연락처: {partner.phone || '-'} · 가능시간: {partner.available_time || '-'}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">
                    이메일: {String((memo as any).email || '-')} · 희망활동비: {String((memo as any).expectedFee || '-')}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm font-bold leading-7 text-[#4E6D69]">
                    {String((memo as any).intro || (memo as any).experience || (memo as any).memo || '')}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => verify(partner.id || '', 'reviewing', partner.memo || '')} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]">검토 중</button>
                    <button onClick={() => verify(partner.id || '', 'approved', partner.memo || '')} className="rounded-xl bg-[#20C5A8] px-4 py-2 text-xs font-black text-white">승인</button>
                    <button onClick={() => verify(partner.id || '', 'active', partner.memo || '')} className="rounded-xl bg-[#193B38] px-4 py-2 text-xs font-black text-white">활동 중</button>
                    <button onClick={() => verify(partner.id || '', 'hold', partner.memo || '')} className="rounded-xl bg-[#FFF8E8] px-4 py-2 text-xs font-black text-[#795313] ring-1 ring-[#F4D8A5]">보류</button>
                    <button onClick={() => verify(partner.id || '', 'rejected', partner.memo || '')} className="rounded-xl bg-[#FFF1F1] px-4 py-2 text-xs font-black text-[#8A2525] ring-1 ring-[#F3BBBB]">거절</button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>

      {result ? <ResultBox result={result} /> : null}
    </PageShell>
  )
}

export function GuardianCareMatchingScreen() {
  const [request, setRequest] = useState<CareRequest | null>(null)
  const [recommendations, setRecommendations] = useState<Partner[]>([])
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const payload = toFormObject(event.currentTarget)

    const response = await fetch('/api/anbu-matching/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await response.json().catch(() => ({}))
    setResult(data)

    if (data.ok) {
      const savedRequest = data.request
      setRequest(savedRequest)

      const recommendResponse = await fetch(
        `/api/anbu-matching/recommend?region=${encodeURIComponent(String(payload.region || ''))}&requestType=${encodeURIComponent(String(payload.requestType || ''))}`,
        { cache: 'no-store' }
      )

      const recommendData = await recommendResponse.json().catch(() => ({}))
      setRecommendations(Array.isArray(recommendData.recommendations) ? recommendData.recommendations : [])
    }

    setLoading(false)
  }

  async function assign(partnerId: string) {
    if (!request?.id) {
      setResult({ ok: false, message: '먼저 케어 요청을 접수해주세요.' })
      return
    }

    setLoading(true)

    const response = await fetch('/api/anbu-matching/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: request.id, partnerId })
    })

    const data = await response.json().catch(() => ({}))
    setResult(data)
    setLoading(false)
  }

  return (
    <PageShell
      eyebrow="보호자 · 케어 요청"
      title="부모님 상황에 맞는 케어파트너를 추천받습니다."
      desc="병원동행, 복약확인, 식사확인, 생활확인, 방문확인 요청을 등록하면 운영실 승인 파트너 중 지역과 업무가 맞는 후보를 보여줍니다."
    >
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="6자리 가족코드" name="familyCode" placeholder="선택 입력" />
          <Input label="보호자 이름" name="guardianName" required />
          <Input label="보호자 연락처" name="guardianPhone" required />
          <Input label="부모님 이름" name="parentName" required />
          <Input label="지역" name="region" placeholder="예: 청주, 강남, 송파" required />

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#55736E]">요청 유형</span>
            <select name="requestType" required className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold">
              {careRequestTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </label>

          <Input label="희망 날짜" name="preferredDate" type="date" />
          <Input label="희망 시간" name="preferredTime" type="time" />

          <div className="md:col-span-2">
            <TextArea label="요청 내용" name="details" placeholder="병원명, 이동 필요 여부, 확인해야 할 내용 등을 적어주세요." />
          </div>

          <button disabled={loading} className="rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-60 md:col-span-2">
            {loading ? '요청 중...' : '케어 요청하고 추천 보기'}
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
        <h2 className="text-2xl font-black tracking-[-0.05em]">추천 케어파트너</h2>

        <div className="mt-5 grid gap-3">
          {recommendations.length === 0 ? (
            <p className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
              요청을 등록하면 추천 파트너가 표시됩니다. 승인된 파트너가 없으면 운영실에서 먼저 승인해주세요.
            </p>
          ) : (
            recommendations.map((partner) => (
              <article key={partner.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                <div className="flex flex-wrap gap-2">
                  <Badge text={`점수 ${partner.matchScore || 0}`} />
                  <Badge text={partner.region || '-'} />
                  {partner.matchReasons?.map((reason) => <Badge key={reason} text={reason} />)}
                </div>

                <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{partner.applicant_name}</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  연락처: {partner.phone || '-'} · 가능시간: {partner.available_time || '-'}
                </p>

                <button
                  onClick={() => assign(partner.id || '')}
                  disabled={loading}
                  className="mt-4 rounded-xl bg-[#20C5A8] px-4 py-2 text-xs font-black text-white disabled:opacity-60"
                >
                  이 파트너 배정
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      {result ? <ResultBox result={result} /> : null}
    </PageShell>
  )
}

function PageShell({
  eyebrow,
  title,
  desc,
  children
}: {
  eyebrow: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            {eyebrow}
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            {desc}
          </p>
        </section>
        {children}
      </section>
    </main>
  )
}

function Input({
  label,
  name,
  type = 'text',
  placeholder = '',
  required = false
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

function TextArea({
  label,
  name,
  placeholder = ''
}: {
  label: string
  name: string
  placeholder?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <textarea
        name={name}
        rows={4}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold leading-6 outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

function Check({ name, label }: { name: string; label: string }) {
  return (
    <label className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-black text-[#4E6D69] ring-1 ring-[#D8EEE8]">
      <input name={name} value="yes" type="checkbox" className="mr-2" />
      {label}
    </label>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7]">
      {text}
    </span>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#11977F]">{value}</div>
    </section>
  )
}

function ResultBox({ result }: { result: unknown }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
      <h2 className="text-2xl font-black tracking-[-0.05em]">처리 결과</h2>
      <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
        {JSON.stringify(result, null, 2)}
      </pre>
    </section>
  )
}
