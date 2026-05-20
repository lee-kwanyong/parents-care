'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

function makeParentCode(parentPhone: string) {
  const digits = parentPhone.replace(/\D/g, '')

  if (digits.length >= 4) {
    return digits.slice(-4)
  }

  return '2580'
}

export function GuardianSignupPanel() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    parentName: '어머니',
    parentPhone: ''
  })
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const parentCode = useMemo(() => makeParentCode(form.parentPhone), [form.parentPhone])

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/session-lite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guardian_signup',
          name: form.name,
          phone: form.phone
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '회원가입 중 오류가 발생했습니다.')
      }

      setDone(true)
      setMessage('보호자 회원가입이 완료됐습니다. 부모님께 4자리 접속코드를 전달할 수 있습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function copyInvite() {
    const message = `[부모님 안심케어] ${form.parentName || '부모님'} 전용 화면 접속 안내

아래 주소로 들어가서 4자리 코드를 입력해주세요.

주소: https://parents-care.net/parent/login
접속코드: ${parentCode}

식사, 약, 컨디션, 자녀 전화, 긴급 도움 요청을 큰 버튼으로 사용할 수 있어요.`

    try {
      await navigator.clipboard.writeText(message)
      setMessage('부모님 초대 문구를 복사했습니다.')
    } catch {
      setMessage(message)
    }
  }

  return (
    <CareCard tone="white">
      <div className="flex flex-wrap gap-2">
        <StatusPill text="보호자 회원가입" tone="green" />
        <StatusPill text="부모님 초대 가능" tone="slate" />
      </div>

      <h2 className="mt-4 text-3xl font-black">
        보호자 정보를 입력하세요.
      </h2>

      <p className="mt-2 text-sm font-bold leading-6 text-[#63807C]">
        보호자는 안심케어 신청, 운영실 진행 확인, 보호자 리포트 확인을 합니다.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="보호자 이름"
            value={form.name}
            onChange={(value) => update('name', value)}
            placeholder="예: 홍길동"
          />
          <Input
            label="보호자 휴대폰"
            value={form.phone}
            onChange={(value) => update('phone', value)}
            placeholder="010-0000-0000"
          />
          <Input
            label="부모님 호칭"
            value={form.parentName}
            onChange={(value) => update('parentName', value)}
            placeholder="예: 어머니"
          />
          <Input
            label="부모님 휴대폰"
            value={form.parentPhone}
            onChange={(value) => update('parentPhone', value)}
            placeholder="010-0000-0000"
          />
        </div>

        <div className="rounded-2xl bg-[#F0FBF7] p-5 ring-1 ring-[#D3ECE6]">
          <div className="text-sm font-black text-[#2F756B]">부모님 4자리 접속코드</div>
          <div className="mt-2 text-5xl font-black tracking-widest text-[#193B38]">
            {parentCode}
          </div>
          <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
            부모님은 이 코드로 /parent/login에서 간단히 들어갈 수 있습니다.
          </p>
        </div>

        {message ? (
          <div className="rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-3xl bg-[#19B99A] px-6 py-5 text-xl font-black text-white shadow-[0_18px_45px_rgba(25,185,154,0.25)] disabled:opacity-60"
        >
          {saving ? '가입 중...' : '보호자 회원가입'}
        </button>
      </form>

      {done ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={copyInvite}
            className="rounded-3xl bg-[#193B38] px-5 py-4 font-black text-white"
          >
            부모님 초대 문구 복사
          </button>

          <Link
            href="/care-request"
            className="rounded-3xl bg-white px-5 py-4 text-center font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
          >
            안심케어 신청하기
          </Link>

          <Link
            href="/child/reports"
            className="rounded-3xl bg-white px-5 py-4 text-center font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
          >
            보호자 리포트 보기
          </Link>
        </div>
      ) : null}
    </CareCard>
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
      <span className="mb-2 block text-sm font-black text-[#4E6D69]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#E0EFEC] p-4 font-bold outline-none focus:border-emerald-500"
      />
    </label>
  )
}
