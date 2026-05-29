'use client'

import Link from 'next/link'
import { useState } from 'react'

type CreatedLink = {
  familyCode: string
  raw: unknown
}

export default function FamilyLinkPage() {
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [created, setCreated] = useState<CreatedLink | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function normalizePhone(value: string) {
    return value.replace(/[^\d]/g, '')
  }

  function extractCode(data: any) {
    return (
      data?.familyCode ||
      data?.family_code ||
      data?.code ||
      data?.link?.family_code ||
      data?.link?.familyCode ||
      data?.data?.family_code ||
      data?.data?.familyCode ||
      ''
    )
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setCreated(null)

    const cleanGuardianPhone = normalizePhone(guardianPhone)
    const cleanParentPhone = normalizePhone(parentPhone)

    if (!guardianName.trim() || !cleanGuardianPhone || !parentName.trim() || !cleanParentPhone) {
      setMessage('보호자 이름, 보호자 연락처, 부모님 이름, 부모님 연락처를 모두 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/anbu-family-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          guardianName: guardianName.trim(),
          guardianPhone: cleanGuardianPhone,
          parentName: parentName.trim(),
          parentPhone: cleanParentPhone
        })
      })

      const data = await response.json().catch(() => ({}))
      const familyCode = extractCode(data)

      if (!response.ok || !data.ok || !/^\d{6}$/.test(String(familyCode))) {
        setMessage(data.message || '연결코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      setCreated({
        familyCode: String(familyCode),
        raw: data
      })

      setMessage('부모님 연결코드가 생성되었습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '연결코드 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            1단계 · 부모님-자녀 연결
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            보호자가 정보를 입력한 뒤에만 6자리 연결코드를 만듭니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76]">
            가입 전에는 코드가 노출되지 않습니다. 보호자가 부모님 정보를 입력하고 연결코드 만들기를 누르면,
            부모님에게 전달할 6자리 코드가 생성됩니다.
          </p>
        </section>

        {message ? (
          <section className="rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
            {message}
          </section>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">보호자 코드 생성</h2>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <Input
                label="보호자 이름"
                value={guardianName}
                onChange={setGuardianName}
                placeholder="예: 이관용"
              />

              <Input
                label="보호자 연락처"
                value={guardianPhone}
                onChange={setGuardianPhone}
                placeholder="예: 010-0000-0000"
                inputMode="tel"
              />

              <Input
                label="부모님 이름"
                value={parentName}
                onChange={setParentName}
                placeholder="예: 어머니"
              />

              <Input
                label="부모님 연락처"
                value={parentPhone}
                onChange={setParentPhone}
                placeholder="예: 010-0000-0000"
                inputMode="tel"
              />

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:bg-[#9FB8B3]"
              >
                {loading ? '연결코드 생성 중...' : '부모님 연결코드 만들기'}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">현재 연결코드</h2>

            {created ? (
              <>
                <div className="mt-5 rounded-[1.75rem] bg-[#123F38] p-6 text-white">
                  <div className="text-sm font-black text-[#A7F2E3]">부모님께 전달할 코드</div>
                  <div className="mt-3 text-6xl font-black tracking-[0.14em]">
                    {created.familyCode}
                  </div>
                  <p className="mt-4 text-sm font-bold leading-7 text-[#E7FFF7]">
                    부모님은 /parent/login 에서 이 코드만 입력하면 됩니다.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/parent/login"
                    className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-center text-sm font-black text-white"
                  >
                    부모님 로그인 화면
                  </Link>

                  <Link
                    href="/parent/today"
                    className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
                  >
                    안부 버튼 화면
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-[1.75rem] bg-[#F8FCFB] p-6 ring-1 ring-[#D8EEE8]">
                <div className="text-lg font-black text-[#173B36]">아직 코드가 생성되지 않았습니다.</div>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                  왼쪽 입력란을 모두 작성한 뒤 “부모님 연결코드 만들기”를 눌러주세요.
                  가입 전에는 코드가 먼저 노출되지 않습니다.
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          {[
            ['1', '보호자 정보 입력'],
            ['2', '6자리 연결코드 생성'],
            ['3', '부모님이 코드 입력 및 동의'],
            ['4', '안부 버튼이 해당 보호자에게 연결']
          ].map(([step, text]) => (
            <div key={step} className="rounded-2xl bg-white p-5 ring-1 ring-[#D8EEE8]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8FAF5] text-sm font-black text-[#11977F]">
                {step}
              </div>
              <p className="mt-5 text-base font-black leading-7">{text}</p>
            </div>
          ))}
        </section>
      </section>
    </main>
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
  inputMode?: 'text' | 'tel'
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
