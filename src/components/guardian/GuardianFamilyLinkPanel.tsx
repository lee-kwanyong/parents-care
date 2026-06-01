'use client'

import Link from 'next/link'
import { useState } from 'react'

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, '')
}

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 90) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

export function GuardianFamilyLinkPanel() {
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [familyCode, setFamilyCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (!guardianName.trim()) {
      setMessage('보호자 이름을 입력해주세요.')
      return
    }

    if (!parentName.trim()) {
      setMessage('부모님 이름을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/family-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardianName,
          guardianPhone: normalizePhone(guardianPhone),
          parentName,
          parentPhone: normalizePhone(parentPhone)
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '연결코드 생성에 실패했습니다.')
        if (data.fallbackCode) setFamilyCode(data.fallbackCode)
        return
      }

      const code = data.familyCode || data.family?.family_code

      setFamilyCode(code)
      setMessage('부모님께 전달할 6자리 연결코드가 생성되었습니다.')

      window.localStorage.setItem('anbu_guardian_family_code', code)
      window.localStorage.setItem('anbu_selected_family_code', code)
      setCookie('anbu_guardian_family_code', code)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '연결코드 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            자녀-부모 연결
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            보호자가 부모님 연결코드를
            <br />
            만듭니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            생성된 6자리 코드를 부모님께 알려드리면, 부모님은 회원가입 없이 코드만 입력해서 안부 버튼을 사용할 수 있습니다.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <form onSubmit={submit} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">연결 정보 입력</h2>

            <div className="mt-5 space-y-4">
              <Input label="보호자 이름" value={guardianName} onChange={setGuardianName} placeholder="예: 홍길동" />
              <Input label="보호자 연락처" value={guardianPhone} onChange={setGuardianPhone} placeholder="예: 010-0000-0000" />
              <Input label="부모님 이름" value={parentName} onChange={setParentName} placeholder="예: 어머니" />
              <Input label="부모님 연락처" value={parentPhone} onChange={setParentPhone} placeholder="예: 010-0000-0000" />

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-60"
              >
                {loading ? '생성 중...' : '부모님 연결코드 만들기'}
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">부모님께 전달할 코드</h2>

            {familyCode ? (
              <div className="mt-5 rounded-[2rem] bg-[#123F38] p-6 text-white">
                <div className="text-sm font-black text-[#A7F2E3]">6자리 연결코드</div>
                <div className="mt-3 text-6xl font-black tracking-[0.12em]">{familyCode}</div>
                <p className="mt-4 text-sm font-bold leading-7 text-[#E7FFF7]">
                  부모님은 /parent/login 에서 이 코드만 입력하면 됩니다.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                아직 코드가 생성되지 않았습니다.
              </div>
            )}

            {message ? (
              <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
                {message}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              <Link href="/parent/login" className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                부모님 코드입력 화면 보기
              </Link>

              <Link href="/child/dashboard" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                부모님 케어 화면 보기
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
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
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

export default GuardianFamilyLinkPanel
