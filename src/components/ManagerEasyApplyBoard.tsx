'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'

export function ManagerEasyApplyBoard() {
  const [form, setForm] = useState({
    applicantName: '',
    applicantPhone: '',
    birthYear: '',
    addressText: '',
    availableRegions: '',
    careerYears: '',
    careerSummary: '',
    hasCareWorkerCertificate: false,
    hasHospitalTraining: false,
    hasCprTraining: false,
    vehicleOwned: false,
    drivingLicenseOwned: false,
    understandsTransportPolicy: true,
    privacyAgreement: true,
    servicePolicyAgreement: true,
    backgroundCheckConsent: true,
    introText: ''
  })

  const [message, setMessage] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-easy-vetting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_application',
          ...form,
          availableRegions: form.availableRegions.split(',').map((item) => item.trim()).filter(Boolean),
          availableDays: ['월', '화', '수', '목', '금'],
          availableTimeSlots: ['오전', '오후'],
          specialties: [
            form.hasCareWorkerCertificate ? '요양보호' : '',
            form.hasHospitalTraining ? '병원동행' : '',
            '약국·복약 확인'
          ].filter(Boolean)
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '매니저 등록 중 오류가 발생했습니다.')
      }

      setApplicationId(result.application.id)
      setMessage(result.message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매니저 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppFrame title="매니저 등록" subtitle="검증 매니저 풀 등록 화면" showMobileNav={false}>
      <section className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="text-sm font-black text-[#19A98E]">매니저 등록</div>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
            3분 간단 등록
          </h1>
          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79]">
            복잡한 서류는 나중에 단계별로 제출합니다. 먼저 이름, 연락처, 활동지역, 기본 동의만 입력하면 됩니다.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-5">
          <section className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <Badge text="1단계" />
            <h2 className="mt-3 text-2xl font-black">기본 정보</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Input label="이름" value={form.applicantName} onChange={(v) => update('applicantName', v)} placeholder="예: 홍길동" />
              <Input label="휴대폰" value={form.applicantPhone} onChange={(v) => update('applicantPhone', v)} placeholder="010-0000-0000" />
              <Input label="출생연도" value={form.birthYear} onChange={(v) => update('birthYear', v)} placeholder="예: 1978" />
              <Input label="거주지" value={form.addressText} onChange={(v) => update('addressText', v)} placeholder="예: 서울 강남구" />
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <Badge text="2단계" />
            <h2 className="mt-3 text-2xl font-black">활동 가능 정보</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Input label="활동 가능 지역" value={form.availableRegions} onChange={(v) => update('availableRegions', v)} placeholder="예: 강남구, 서초구, 송파구" />
              <Input label="경력 연수" value={form.careerYears} onChange={(v) => update('careerYears', v)} placeholder="예: 3" />
            </div>
            <textarea
              value={form.careerSummary}
              onChange={(event) => update('careerSummary', event.target.value)}
              className="mt-3 min-h-28 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold outline-none focus:border-[#19B99A]"
              placeholder="경험을 짧게 적어주세요. 예: 병원동행, 약국동행, 어르신 응대 경험이 있습니다."
            />
          </section>

          <section className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <Badge text="3단계" />
            <h2 className="mt-3 text-2xl font-black">자격·교육 체크</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Check label="요양보호사 또는 관련 자격이 있어요" checked={form.hasCareWorkerCertificate} onChange={(v) => update('hasCareWorkerCertificate', v)} />
              <Check label="병원동행 교육/경험이 있어요" checked={form.hasHospitalTraining} onChange={(v) => update('hasHospitalTraining', v)} />
              <Check label="응급상황 대응 교육 경험이 있어요" checked={form.hasCprTraining} onChange={(v) => update('hasCprTraining', v)} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <Badge text="4단계" />
            <h2 className="mt-3 text-2xl font-black">안전 동의</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Check label="개인정보·병원정보를 안전하게 다루겠습니다" checked={form.privacyAgreement} onChange={(v) => update('privacyAgreement', v)} />
              <Check label="의료행위, 처방변경, 복약지시는 하지 않겠습니다" checked={form.servicePolicyAgreement} onChange={(v) => update('servicePolicyAgreement', v)} />
              <Check label="개인차량 직접 유상운송은 기본 서비스가 아님을 이해했습니다" checked={form.understandsTransportPolicy} onChange={(v) => update('understandsTransportPolicy', v)} />
              <Check label="결격사유 확인 절차에 동의합니다" checked={form.backgroundCheckConsent} onChange={(v) => update('backgroundCheckConsent', v)} />
            </div>
          </section>

          {message ? (
            <div className="rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
              {message}
            </div>
          ) : null}

          <button
            disabled={submitting}
            className="w-full rounded-3xl bg-[#19B99A] px-6 py-5 text-xl font-black text-white shadow-[0_18px_45px_rgba(25,185,154,0.25)] disabled:opacity-60"
          >
            {submitting ? '등록 중...' : '매니저 간단 등록하기'}
          </button>

          {applicationId ? (
            <Link
              href="/manager/vetting"
              className="block rounded-3xl bg-white px-6 py-5 text-center text-xl font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              단계별 검증자료 제출하기
            </Link>
          ) : null}
        </form>
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

function Check({
  label,
  checked,
  onChange
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl bg-[#F6FCFA] p-4 ring-1 ring-[#E3EFEC]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5"
      />
      <span className="text-sm font-black leading-6">{label}</span>
    </label>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex rounded-full bg-[#E5F8F4] px-3 py-1 text-xs font-black text-[#2F756B] ring-1 ring-[#CBEAE4]">
      {text}
    </span>
  )
}
