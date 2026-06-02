'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

function digits(value: string) {
  return value.replace(/[^\d]/g, '')
}

function code6(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
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

function readFamilyCode() {
  if (typeof window === 'undefined') return ''

  const keys = [
    'anbu_guardian_family_code',
    'anbu_selected_family_code',
    'anbu_last_family_code',
    'anbu_family_code',
    'pc_parent_invite_code'
  ]

  for (const key of keys) {
    const code = code6(window.localStorage.getItem(key) || '')
    if (/^\d{6}$/.test(code)) return code
  }

  return ''
}

async function safeJson(response: Response) {
  const raw = await response.text()

  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return { message: raw || '응답을 읽지 못했습니다.' }
  }
}

export function FamilyMemberInvitePanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [inviterName, setInviterName] = useState('')
  const [inviterPhone, setInviterPhone] = useState('')
  const [inviteeName, setInviteeName] = useState('')
  const [inviteePhone, setInviteePhone] = useState('')
  const [relationship, setRelationship] = useState('가족')
  const [inviteCode, setInviteCode] = useState('')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const cleanInviteePhone = digits(inviteePhone)
  const joinUrl = inviteCode
    ? `https://parents-care.net/family/join?invite=${inviteCode}`
    : 'https://parents-care.net/family/join'

  const sendMessage = inviteCode
    ? `부모님 안심케어 가족 초대입니다.\n\n초대코드: ${inviteCode}\n\n아래 링크에서 초대코드와 본인 휴대폰 번호 뒤 4자리를 입력하면 부모님 리포트를 함께 볼 수 있습니다.\n${joinUrl}`
    : ''

  const smsHref = inviteCode && cleanInviteePhone
    ? `sms:${cleanInviteePhone}?&body=${encodeURIComponent(sendMessage)}`
    : '#'

  useEffect(() => {
    const profile = readGuardianProfile()

    if (!profile) {
      alert('다른 가족 초대는 보호자 로그인이 필요해요 !')
      window.location.href = '/login?next=/family/invite'
      return
    }

    setInviterName(profile.guardianName || '')
    setInviterPhone(profile.guardianPhone || '')
    setFamilyCode(readFamilyCode())
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setDebug('')
    setCopied(false)

    const profile = readGuardianProfile()
    const code = code6(familyCode)
    const phone = digits(inviteePhone)

    if (!profile) {
      alert('다른 가족 초대는 보호자 로그인이 필요해요 !')
      window.location.href = '/login?next=/family/invite'
      return
    }

    if (!/^\d{6}$/.test(code)) {
      setMessage('부모님 연결코드를 찾지 못했습니다. 먼저 부모님 연결코드를 만든 뒤 초대해주세요.')
      return
    }

    if (!inviteeName.trim()) {
      setMessage('초대할 가족 이름을 입력해주세요.')
      return
    }

    if (phone.length < 10) {
      setMessage('초대할 가족 휴대폰 번호를 정확히 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/family-member-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: code,
          inviterId: profile.guardianId || '',
          inviterEmail: profile.guardianEmail || '',
          inviterName,
          inviterPhone: digits(inviterPhone),
          inviteeName,
          inviteePhone: phone,
          relationship
        })
      })

      const data = await safeJson(response)

      if (!response.ok || !data.ok) {
        setMessage(data.message || '가족 초대코드 생성에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      const createdCode = data.inviteCode

      setInviteCode(createdCode)
      setMessage('다른 가족에게 보낼 초대코드가 생성되었습니다.')

      window.localStorage.setItem('anbu_last_family_member_invite_code', createdCode)
      setCookie('anbu_last_family_member_invite_code', createdCode)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 초대코드 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyMessage() {
    if (!sendMessage) return

    try {
      await navigator.clipboard.writeText(sendMessage)
      setCopied(true)
      setMessage('초대 문구가 복사되었습니다. 카톡이나 문자에 붙여넣어 보내세요.')
    } catch {
      setCopied(false)
      setMessage('복사에 실패했습니다. 아래 문구를 직접 선택해서 복사해주세요.')
    }
  }

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            다른 가족 초대
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            가족도 부모님 리포트를
            <br />
            함께 볼 수 있습니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            초대받은 가족은 6자리 초대코드와 본인 휴대폰 번호 뒤 4자리를 입력해야 부모님 리포트에 접근할 수 있습니다.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <form onSubmit={submit} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">초대 정보</h2>

            <div className="mt-5 space-y-4">
              <Input label="현재 부모님 연결코드" value={familyCode} onChange={(value) => setFamilyCode(code6(value))} placeholder="예: 123456" />
              <Input label="보호자 이름" value={inviterName} onChange={setInviterName} placeholder="예: 홍길동" />
              <Input label="보호자 연락처" value={inviterPhone} onChange={setInviterPhone} placeholder="예: 010-0000-0000" />
              <Input label="초대할 가족 이름" value={inviteeName} onChange={setInviteeName} placeholder="예: 형제, 자매, 배우자" />
              <Input label="초대할 가족 휴대폰 번호" value={inviteePhone} onChange={setInviteePhone} placeholder="예: 010-0000-0000" />

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#55736E]">관계</span>
                <select
                  value={relationship}
                  onChange={(event) => setRelationship(event.target.value)}
                  className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                >
                  <option value="가족">가족</option>
                  <option value="형제자매">형제자매</option>
                  <option value="배우자">배우자</option>
                  <option value="자녀">자녀</option>
                  <option value="친척">친척</option>
                  <option value="기타">기타</option>
                </select>
              </label>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-60"
              >
                {loading ? '생성 중...' : '다른 가족 초대코드 만들기'}
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">가족에게 보낼 초대코드</h2>

            {inviteCode ? (
              <>
                <div className="mt-5 rounded-[2rem] bg-[#123F38] p-6 text-white">
                  <div className="text-sm font-black text-[#A7F2E3]">6자리 가족 초대코드</div>
                  <div className="mt-3 text-6xl font-black tracking-[0.12em]">{inviteCode}</div>
                  <p className="mt-4 text-sm font-bold leading-7 text-[#E7FFF7]">
                    초대받은 가족의 휴대폰 뒤 4자리까지 맞아야 리포트 접근이 가능합니다.
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
                    className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
                  >
                    {copied ? '복사 완료' : '문구 복사'}
                  </button>
                </div>

                <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#4E6D69] ring-1 ring-[#D8EEE8]">
                  {sendMessage}
                </pre>
              </>
            ) : (
              <div className="mt-5 rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                아직 초대코드가 생성되지 않았습니다.
              </div>
            )}

            {message ? (
              <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
                {message}
              </div>
            ) : null}

            {debug ? (
              <details className="mt-4 rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
                <summary className="cursor-pointer text-sm font-black">상세 오류 보기</summary>
                <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap">{debug}</pre>
              </details>
            ) : null}

            <div className="mt-5 grid gap-3">
              <Link
                href={inviteCode ? `/family/join?invite=${inviteCode}` : '/family/join'}
                className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
              >
                가족 초대코드 입력 화면 보기
              </Link>

              <Link
                href="/child/dashboard"
                className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
              >
                부모님 리포트 보기
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

export default FamilyMemberInvitePanel
