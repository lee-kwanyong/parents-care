'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, '')
}

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 90) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

function readGuardianProfile() {
  if (typeof window === 'undefined') return null

  const raw =
    window.localStorage.getItem('anbu_guardian_profile') ||
    window.localStorage.getItem('parents_care_auth') ||
    window.localStorage.getItem('anbu_current_user')

  if (!raw) return null

  try {
    return JSON.parse(raw) as {
      guardianId?: string
      guardianEmail?: string
      guardianName?: string
      guardianPhone?: string
    }
  } catch {
    return null
  }
}

async function safeJson(response: Response) {
  const raw = await response.text()

  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return { message: raw || '응답을 읽지 못했습니다.' }
  }
}

export function GuardianFamilyLinkPanel() {
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [familyCode, setFamilyCode] = useState('')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const cleanParentPhone = normalizePhone(parentPhone)

  const parentLoginUrl = familyCode
    ? `https://parents-care.net/parent/login?code=${familyCode}`
    : 'https://parents-care.net/parent/login'

  const sendMessage = familyCode
    ? `부모님 안심케어 연결 안내입니다.\n\n6자리 코드: ${familyCode}\n\n아래 링크를 누른 뒤, 6자리 코드와 부모님 휴대폰 번호 뒤 4자리를 입력해주세요.\n${parentLoginUrl}`
    : ''

  const smsHref = familyCode && cleanParentPhone
    ? `sms:${cleanParentPhone}?&body=${encodeURIComponent(sendMessage)}`
    : '#'

  useEffect(() => {
    const profile = readGuardianProfile()

    if (profile) {
      setGuardianName(profile.guardianName || '')
      setGuardianPhone(profile.guardianPhone || '')
    }
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setDebug('')
    setCopied(false)

    const profile = readGuardianProfile()

    if (!profile) {
      alert('부모님과 연결시 로그인이 필요해요 !')
      window.location.href = '/login?next=/family-link'
      return
    }

    const cleanGuardianPhone = normalizePhone(guardianPhone)
    const cleanParent = normalizePhone(parentPhone)

    if (!guardianName.trim()) {
      setMessage('보호자 이름을 입력해주세요.')
      return
    }

    if (!parentName.trim()) {
      setMessage('부모님 이름을 입력해주세요.')
      return
    }

    if (cleanParent.length < 10) {
      setMessage('부모님 휴대폰 번호를 정확히 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/family-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardianId: profile.guardianId || '',
          guardianEmail: profile.guardianEmail || '',
          guardianName,
          guardianPhone: cleanGuardianPhone,
          parentName,
          parentPhone: cleanParent
        })
      })

      const data = await safeJson(response)

      if (!response.ok || !data.ok) {
        setMessage(data.message || '연결코드 생성에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      const code = data.familyCode

      setFamilyCode(code)
      setMessage('부모님께 보낼 6자리 연결코드가 생성되었습니다.')

      window.localStorage.setItem('anbu_guardian_family_code', code)
      window.localStorage.setItem('anbu_selected_family_code', code)
      window.localStorage.setItem('anbu_last_family_code', code)
      window.localStorage.setItem('anbu_parent_phone_for_link', cleanParent)
      setCookie('anbu_guardian_family_code', code)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '연결코드 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyMessage() {
    if (!sendMessage) return

    try {
      await navigator.clipboard.writeText(sendMessage)
      setCopied(true)
      setMessage('부모님께 보낼 문구가 복사되었습니다. 카톡이나 문자에 붙여넣어 보내세요.')
    } catch {
      setCopied(false)
      setMessage('복사에 실패했습니다. 아래 문구를 직접 선택해서 복사해주세요.')
    }
  }

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            부모님과 연결
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            부모님 휴대폰으로
            <br />
            연결코드를 보내드립니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            잘못 매칭되지 않도록 부모님은 6자리 코드와 본인 휴대폰 번호 뒤 4자리를 함께 입력해야 연결됩니다.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <form onSubmit={submit} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">연결 정보</h2>

            <div className="mt-5 space-y-4">
              <Input label="보호자 이름" value={guardianName} onChange={setGuardianName} placeholder="예: 홍길동" />
              <Input label="보호자 연락처" value={guardianPhone} onChange={setGuardianPhone} placeholder="예: 010-0000-0000" />
              <Input label="부모님 이름" value={parentName} onChange={setParentName} placeholder="예: 어머니" />
              <Input label="부모님 휴대폰 번호" value={parentPhone} onChange={setParentPhone} placeholder="예: 010-0000-0000" />

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-[#247A71] px-5 py-4 text-base font-black text-white disabled:opacity-60"
              >
                {loading ? '생성 중...' : '부모님 연결코드 만들기'}
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">부모님께 보낼 코드</h2>

            {familyCode ? (
              <>
                <div className="mt-5 rounded-[2rem] bg-[#247A71] p-6 text-white">
                  <div className="text-sm font-black text-[#A7F2E3]">6자리 연결코드</div>
                  <div className="mt-3 text-6xl font-black tracking-[0.12em]">{familyCode}</div>
                  <p className="mt-4 text-sm font-bold leading-7 text-[#E7FFF7]">
                    부모님 휴대폰 뒤 4자리까지 맞아야 연결됩니다.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <a
                    href={smsHref}
                    className="rounded-2xl bg-[#20BFA7] px-5 py-4 text-center text-sm font-black text-white"
                  >
                    문자앱으로 보내기
                  </a>

                  <button
                    type="button"
                    onClick={copyMessage}
                    className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                  >
                    {copied ? '복사 완료' : '문구 복사'}
                  </button>
                </div>

                <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#4E6D69] ring-1 ring-[#D6EDE7]">
                  {sendMessage}
                </pre>
              </>
            ) : (
              <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 코드가 생성되지 않았습니다.
              </div>
            )}

            {message ? (
              <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
                {message}
              </div>
            ) : null}

            {debug ? (
              <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
                <summary className="cursor-pointer text-sm font-black">상세 오류 보기</summary>
                <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap">{debug}</pre>
              </details>
            ) : null}

            <div className="mt-5 grid gap-3">
              <Link
                href={familyCode ? `/parent/login?code=${familyCode}` : '/parent/login'}
                className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
              >
                부모님 코드입력 화면 보기
              </Link>

              <Link
                href="/child/dashboard"
                className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
              >
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
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

export default GuardianFamilyLinkPanel
