'use client'

import { useState } from 'react'

const capabilityFields = [
  { key: 'hasCaregiverLicense', label: '요양보호사 자격증 보유' },
  { key: 'canHospitalAccompany', label: '병원동행 가능' },
  { key: 'canMedicationCheck', label: '복약 확인 가능' },
  { key: 'canMealCheck', label: '식사 확인 가능' },
  { key: 'canDrive', label: '차량 이동 가능' }
]

export function CarePartnerApplicationForm() {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const form = new FormData(event.currentTarget)

    const payload = {
      applicantName: String(form.get('applicantName') || ''),
      phone: String(form.get('phone') || ''),
      email: String(form.get('email') || ''),
      region: String(form.get('region') || ''),
      availableTime: String(form.get('availableTime') || ''),
      memo: String(form.get('memo') || ''),
      hasCaregiverLicense: form.get('hasCaregiverLicense') === 'on',
      canHospitalAccompany: form.get('canHospitalAccompany') === 'on',
      canMedicationCheck: form.get('canMedicationCheck') === 'on',
      canMealCheck: form.get('canMealCheck') === 'on',
      canDrive: form.get('canDrive') === 'on'
    }

    try {
      const response = await fetch('/api/care-partners/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '신청 저장에 실패했습니다.')
      }

      event.currentTarget.reset()
      setMessage('케어파트너 신청이 접수되었습니다. 운영실 확인 후 연락드리겠습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '신청 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-8 text-[#17443F]">
      <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
        <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
          안부웍스 케어파트너
        </div>

        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          부모님 안부를 함께 확인할
          <br />
          케어파트너를 모집합니다.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          요양보호사, 병원동행매니저, 생활확인 가능 파트너가 활동 지역과 가능한 업무를 등록하면
          운영실 검증 후 보호자 요청과 연결합니다.
        </p>
      </div>

      <form onSubmit={submit} className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
        <h2 className="text-2xl font-black tracking-[-0.05em]">파트너 신청서</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input name="applicantName" label="이름" placeholder="예: 김안부" required />
          <Input name="phone" label="연락처" placeholder="예: 010-0000-0000" required />
          <Input name="email" label="이메일" placeholder="선택 입력" />
          <Input name="region" label="활동 지역" placeholder="예: 청주, 강남, 송파, 분당" required />
          <Input name="availableTime" label="가능 요일/시간" placeholder="예: 평일 오전, 주말 가능" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {capabilityFields.map((field) => (
            <label key={field.key} className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              <input name={field.key} type="checkbox" className="mr-2" />
              {field.label}
            </label>
          ))}
        </div>

        <label className="mt-5 grid gap-2">
          <span className="text-sm font-black text-[#637B76]">자기소개 / 활동 가능 업무</span>
          <textarea
            name="memo"
            className="min-h-32 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
            placeholder="예: 병원동행, 약국동행, 식사 확인, 보호자 리포트 작성 가능"
          />
        </label>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#2AA897] ring-1 ring-[#CDEFE7]">
            {message}
          </div>
        ) : null}

        <button
          disabled={saving}
          className="mt-5 rounded-2xl bg-[#247A71] px-5 py-4 text-base font-black text-white disabled:opacity-60"
        >
          {saving ? '접수 중...' : '케어파트너 신청하기'}
        </button>
      </form>

      <div className="mt-5 rounded-[2rem] bg-[#247A71] p-5 text-white sm:p-6">
        <h2 className="text-2xl font-black tracking-[-0.05em]">활동 범위 안내</h2>
        <p className="mt-3 text-sm font-bold leading-7 text-[#CDEEE6]">
          안부웍스 케어파트너는 의료행위, 진단, 처방, 투약 결정을 하지 않습니다.
          식사 확인, 복약 여부 확인, 병원동행, 약국동행, 귀가 확인, 보호자 리포트 작성처럼 생활 확인 중심으로 활동합니다.
        </p>
      </div>
    </section>
  )
}

function Input({
  name,
  label,
  placeholder,
  required = false
}: {
  name: string
  label: string
  placeholder: string
  required?: boolean
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        name={name}
        required={required}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
        placeholder={placeholder}
      />
    </label>
  )
}
