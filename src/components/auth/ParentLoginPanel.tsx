'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type ParentSession = {
  familyCode: string
  parentName?: string
  parentPhone?: string
  guardianName?: string
  guardianPhone?: string
  role?: string
  loggedIn?: boolean
  connected?: boolean
}

function normalizeCode(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 60) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`
}

function saveParentSession(session: ParentSession) {
  const familyCode = normalizeCode(session.familyCode || '')

  if (!familyCode) return

  const payload = {
    ...session,
    familyCode,
    role: 'parent',
    loggedIn: true,
    connected: true,
    savedAt: new Date().toISOString()
  }

  const raw = JSON.stringify(payload)

  window.localStorage.setItem('anbu_family_code', familyCode)
  window.localStorage.setItem('pc_parent_invite_code', familyCode)
  window.localStorage.setItem('anbu_parent_code', familyCode)
  window.localStorage.setItem('anbu_parent_family_code', familyCode)
  window.localStorage.setItem('parent_family_code', familyCode)
  window.localStorage.setItem('parent_invite_code', familyCode)
  window.localStorage.setItem('parent_link_code', familyCode)
  window.localStorage.setItem('anbu_login_role', 'parent')
  window.localStorage.setItem('anbu_auth_state', 'parent-signed-in')
  window.localStorage.setItem('anbu_parent_logged_in', 'true')
  window.localStorage.setItem('anbu_parent_connected', 'true')
  window.localStorage.setItem('anbu_parent_session', raw)
  window.localStorage.setItem('parents_care_parent_session', raw)

  setCookie('anbu_family_code', familyCode)
  setCookie('pc_parent_invite_code', familyCode)
  setCookie('anbu_parent_code', familyCode)
  setCookie('anbu_login_role', 'parent')
  setCookie('anbu_parent_connected', 'true')
  setCookie('anbu_parent_session', raw)

  window.dispatchEvent(new CustomEvent('anbu-parent-session-changed', { detail: payload }))
  window.dispatchEvent(new CustomEvent('anbu-auth-changed', { detail: payload }))
}

function readStoredCode() {
  if (typeof window === 'undefined') return ''

  const keys = [
    'anbu_family_code',
    'pc_parent_invite_code',
    'anbu_parent_code',
    'anbu_parent_family_code',
    'parent_family_code',
    'parent_invite_code',
    'parent_link_code'
  ]

  for (const key of keys) {
    const code = normalizeCode(window.localStorage.getItem(key) || '')

    if (/^\d{6}$/.test(code)) return code
  }

  return ''
}

function clearParentSession() {
  const keys = [
    'anbu_family_code',
    'pc_parent_invite_code',
    'anbu_parent_code',
    'anbu_parent_family_code',
    'parent_family_code',
    'parent_invite_code',
    'parent_link_code',
    'anbu_parent_logged_in',
    'anbu_parent_connected',
    'anbu_parent_session',
    'parents_care_parent_session'
  ]

  for (const key of keys) {
    window.localStorage.removeItem(key)
  }

  clearCookie('anbu_family_code')
  clearCookie('pc_parent_invite_code')
  clearCookie('anbu_parent_code')
  clearCookie('anbu_parent_connected')
  clearCookie('anbu_parent_session')
}

export function ParentLoginPanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [message, setMessage] = useState('')
  const [session, setSession] = useState<ParentSession | null>(null)
  const [loading, setLoading] = useState(false)

  async function restoreSession(code?: string) {
    const targetCode = normalizeCode(code || readStoredCode())

    if (!targetCode) return

    setLoading(true)

    try {
      const response = await fetch('/api/parent-session?familyCode=' + encodeURIComponent(targetCode), {
        cache: 'no-store'
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.ok && data.session) {
        saveParentSession(data.session)
        setSession(data.session)
        setFamilyCode(data.session.familyCode)
        setMessage('부모님 연결이 유지되어 있습니다.')
      } else {
        setMessage(data.message || '저장된 연결을 확인하지 못했습니다.')
      }
    } catch {
      setMessage('저장된 연결을 확인하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const code = normalizeCode(familyCode)

    if (!/^\d{6}$/.test(code)) {
      setMessage('6자리 연결코드를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/parent-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyCode: code })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok || !data.session) {
        setMessage(data.message || '연결코드를 확인하지 못했습니다.')
        return
      }

      saveParentSession(data.session)
      setSession(data.session)
      setMessage('부모님 연결이 완료되었습니다. 안부 화면으로 이동합니다.')

      setTimeout(() => {
        window.location.href = '/parent/today'
      }, 300)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '부모님 연결 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function logoutParent() {
    setLoading(true)

    try {
      await fetch('/api/parent-session', { method: 'DELETE' })
    } catch {
      // 무시
    }

    clearParentSession()
    setSession(null)
    setFamilyCode('')
    setMessage('부모님 연결을 해제했습니다.')
    setLoading(false)
  }

  useEffect(() => {
    const code = readStoredCode()

    if (code) {
      setFamilyCode(code)
      restoreSession(code)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="mx-auto w-full max-w-xl rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-8">
      <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
        부모님 6자리 접속
      </div>

      <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] text-[#173B36]">
        부모님 안심 화면에
        <br />
        들어갑니다.
      </h1>

      <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
        자녀가 알려준 6자리 연결코드를 입력하면 부모님 안부 버튼 화면으로 이동합니다.
        한 번 연결하면 같은 기기에서는 연결 상태가 유지됩니다.
      </p>

      {session ? (
        <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
          현재 연결됨: {session.parentName || '부모님'} · 코드 {session.familyCode}
        </div>
      ) : null}

      {message ? (
        <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
          {message}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="grid gap-2">
          <span className="text-sm font-black text-[#55736E]">6자리 연결코드</span>
          <input
            value={familyCode}
            onChange={(event) => setFamilyCode(normalizeCode(event.target.value))}
            inputMode="numeric"
            maxLength={6}
            placeholder="예: 123456"
            className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-5 text-center text-4xl font-black tracking-[0.18em] text-[#173B36] outline-none focus:ring-4 focus:ring-[#D6F6EC]"
          />
        </label>

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:bg-[#9FB8B3]"
        >
          {loading ? '확인 중...' : '부모님 안부 화면 들어가기'}
        </button>
      </form>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href="/parent/today"
          className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
        >
          안부 버튼 화면
        </Link>

        <Link
          href="/parent/consent"
          className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
        >
          안심동의 설정
        </Link>
      </div>

      {session ? (
        <button
          type="button"
          onClick={logoutParent}
          className="mt-4 w-full rounded-2xl bg-[#FFF1F1] px-5 py-4 text-sm font-black text-[#8A2525] ring-1 ring-[#F3BBBB]"
        >
          부모님 연결 해제
        </button>
      ) : null}

      <Link
        href="/login"
        className="mt-4 block text-center text-sm font-black text-[#11977F]"
      >
        역할 선택으로 돌아가기
      </Link>
    </section>
  )
}

export default ParentLoginPanel
