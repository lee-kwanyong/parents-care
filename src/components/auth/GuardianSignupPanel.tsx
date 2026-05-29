'use client'

import Link from 'next/link'
import { useState } from 'react'

type Mode = 'signup' | 'login'

export function GuardianSignupPanel() {
  const [mode, setMode] = useState<Mode>('signup')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function normalizePhone(value: string) {
    return value.replace(/[^\d]/g, '')
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const cleanPhone = normalizePhone(guardianPhone)

    if (mode === 'signup' && !guardianName.trim()) {
      setMessage('보호자 이름을 입력해주세요.')
      return
    }

    if (!cleanPhone && !guardianEmail.trim()) {
      setMessage('휴대폰 번호 또는 이메일 중 하나를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/session-lite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode === 'signup' ? 'guardian_signup' : 'guardian_login',
          role: 'guardian',
          guardianName: guardianName.trim(),
          name: guardianName.trim(),
          phone: cleanPhone,
          guardianPhone: cleanPhone,
          email: guardianEmail.trim()
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '처리 중 오류가 발생했습니다.')
        return
      }

      window.localStorage.setItem(
        'anbu_guardian_profile',
        JSON.stringify({
          guardianName: guardianName.trim(),
          guardianPhone: cleanPhone,
          guardianEmail: guardianEmail.trim(),
          createdAt: new Date().toISOString()
        })
      )

      window.location.href = '/family-link'
    } catch {
      window.localStorage.setItem(
        'anbu_guardian_profile',
        JSON.stringify({
          guardianName: guardianName.trim(),
          guardianPhone: cleanPhone,
          guardianEmail: guardianEmail.trim(),
          createdAt: new Date().toISOString(),
          fallback: true
        })
      )

      window.location.href = '/family-link'
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8] sm:p-8">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={
            'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
            (mode === 'signup'
              ? 'bg-[#193B38] text-white ring-[#193B38]'
              : 'bg-white text-[#173B36] ring-[#D8EEE8]')
          }
        >
          보호자 회원가입
        </button>

        <button
          type="button"
          onClick={() => setMode('login')}
          className={
            'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
            (mode === 'login'
              ? 'bg-[#193B38] text-white ring-[#193B38]'
              : 'bg-white text-[#173B36] ring-[#D8EEE8]')
          }
        >
          보호자 로그인
        </button>
      </div>

      <h2 className="mt-6 text-3xl font-black leading-tight tracking-[-0.06em] text-[#173B36]">
        {mode === 'signup' ? '보호자 정보를 입력해주세요.' : '보호자 정보를 확인합니다.'}
      </h2>

      <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
        {mode === 'signup'
          ? '회원가입이 끝나면 부모님 연결코드 생성 화면으로 이동합니다.'
          : '로그인 후 부모님 연결코드 생성 또는 기존 연결 관리 화면으로 이동합니다.'}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'signup' ? (
          <Input
            label="보호자 이름"
            value={guardianName}
            onChange={setGuardianName}
            placeholder="예: 이관용"
          />
        ) : null}

        <Input
          label="휴대폰 번호"
          value={guardianPhone}
          onChange={setGuardianPhone}
          placeholder="예: 010-0000-0000"
          inputMode="tel"
        />

        <Input
          label="이메일"
          value={guardianEmail}
          onChange={setGuardianEmail}
          placeholder="선택 입력"
          inputMode="email"
        />

        {message ? (
          <div className="rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            {message}
          </div>
        ) : null}

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:bg-[#9FB8B3]"
        >
          {loading
            ? '처리 중...'
            : mode === 'signup'
              ? '보호자 회원가입 완료'
              : '보호자 로그인'}
        </button>
      </form>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href="/login"
          className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
        >
          역할 선택으로 돌아가기
        </Link>

        <Link
          href="/parent/login"
          className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
        >
          부모님 코드 입력
        </Link>
      </div>
    </section>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  inputMode = 'text'
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  inputMode?: 'text' | 'tel' | 'email'
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

export default GuardianSignupPanel
