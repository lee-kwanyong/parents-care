'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'

function code6(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

function last4(value: string) {
  return value.replace(/[^\d]/g, '').slice(-4)
}

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 90) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

function saveFamilyMemberSession(session: {
  familyCode: string
  memberName?: string
  inviterName?: string
  role?: string
}) {
  const familyCode = code6(session.familyCode || '')
  if (!/^\d{6}$/.test(familyCode)) return

  const payload = {
    ...session,
    familyCode,
    role: 'family_member',
    connected: true,
    verified: true,
    savedAt: new Date().toISOString()
  }

  const raw = JSON.stringify(payload)

  window.localStorage.setItem('anbu_guardian_family_code', familyCode)
  window.localStorage.setItem('anbu_selected_family_code', familyCode)
  window.localStorage.setItem('anbu_last_family_code', familyCode)
  window.localStorage.setItem('anbu_login_role', 'family_member')
  window.localStorage.setItem('anbu_family_member_connected', 'true')
  window.localStorage.setItem('anbu_family_member_session', raw)
  window.localStorage.setItem('parents_care_auth', raw)

  setCookie('anbu_guardian_family_code', familyCode)
  setCookie('anbu_selected_family_code', familyCode)
  setCookie('anbu_last_family_code', familyCode)
  setCookie('anbu_login_role', 'family_member')
  setCookie('anbu_family_member_connected', 'true')
  setCookie('anbu_family_member_session', raw)

  window.dispatchEvent(new CustomEvent('anbu-auth-changed', { detail: payload }))
}

export function FamilyMemberJoinPanel() {
  const [inviteCode, setInviteCode] = useState('')
  const [phoneLast4, setPhoneLast4] = useState('')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setDebug('')

    const code = code6(inviteCode)
    const phone4 = last4(phoneLast4)

    if (!/^\d{6}$/.test(code)) {
      setMessage('6자리 가족 초대코드를 입력해주세요.')
      return
    }

    if (!/^\d{4}$/.test(phone4)) {
      setMessage('휴대폰 번호 뒤 4자리를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/family-member-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: code,
          phoneLast4: phone4
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok || !data.session) {
        setMessage(data.message || '초대코드와 휴대폰 번호를 확인해주세요.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      saveFamilyMemberSession(data.session)
      setMessage(data.message || '가족 초대가 확인되었습니다. 부모님 리포트로 이동합니다.')

      setTimeout(() => {
        window.location.href = '/child/dashboard?from=family-invite'
      }, 400)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 초대 확인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryCode = code6(params.get('invite') || params.get('code') || params.get('inviteCode') || '')

    if (queryCode) setInviteCode(queryCode)
  }, [])

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-8">
        <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
          가족 초대코드 입력
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em]">
          초대코드와
          <br />
          휴대폰 뒤 4자리를 입력하세요.
        </h1>

        <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
          잘못 연결되지 않도록 초대받은 가족의 휴대폰 번호 뒤 4자리까지 확인합니다.
        </p>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            {message}
          </div>
        ) : null}

        {debug ? (
          <details className="mt-4 rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
            <summary className="cursor-pointer text-sm font-black">상세 오류 보기</summary>
            <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap">{debug}</pre>
          </details>
        ) : null}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#55736E]">6자리 가족 초대코드</span>
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(code6(event.target.value))}
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="w-full min-w-0 max-w-full box-border rounded-2xl border border-[#D8EEE8] bg-white px-3 py-4 text-center text-3xl font-black tracking-[0.10em] text-[#173B36] outline-none focus:ring-4 focus:ring-[#D6F6EC] sm:px-4 sm:text-4xl sm:tracking-[0.16em]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-[#55736E]">내 휴대폰 번호 뒤 4자리</span>
            <input
              value={phoneLast4}
              onChange={(event) => setPhoneLast4(last4(event.target.value))}
              inputMode="numeric"
              maxLength={4}
              placeholder="예: 1234"
              className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-center text-2xl font-black tracking-[0.12em] text-[#173B36] outline-none focus:ring-4 focus:ring-[#D6F6EC]"
            />
          </label>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:bg-[#9FB8B3]"
          >
            {loading ? '확인 중...' : '부모님 리포트 보기'}
          </button>
        </form>

        <div className="mt-5 grid gap-3">
          <Link
            href="/login"
            className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            로그인 화면으로
          </Link>
        </div>
      </section>
    </main>
  )
}

export default FamilyMemberJoinPanel
