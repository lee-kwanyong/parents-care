'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

function safeNextPath() {
  if (typeof window === 'undefined') return '/ops'

  const params = new URLSearchParams(window.location.search)
  const next = params.get('next') || ''

  if (next.startsWith('/') && !next.startsWith('//')) return next

  if (window.location.pathname === '/ops/login') return '/ops'

  return window.location.pathname + window.location.search
}

function shouldRedirectAfterLogin() {
  if (typeof window === 'undefined') return false
  if (window.location.pathname === '/ops/login') return true
  return new URLSearchParams(window.location.search).has('next')
}

export function OpsPasswordGate({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const inputName = useMemo(() => 'ops-password-' + Math.random().toString(36).slice(2), [])

  async function check() {
    setChecking(true)

    try {
      const response = await fetch('/api/ops-auth', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      const authed = Boolean(data.authenticated)

      setAuthenticated(authed)
      setConfigured(data.configured !== false)

      if (data.configured === false) {
        setMessage('운영실 비밀번호 환경변수가 아직 설정되지 않았습니다.')
      }

      if (authed && typeof window !== 'undefined' && window.location.pathname === '/ops/login') {
        window.location.replace(safeNextPath())
      }
    } catch {
      setAuthenticated(false)
    } finally {
      setChecking(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const clean = password.replace(/[^\d]/g, '').slice(0, 6)

    if (clean.length !== 6) {
      setMessage('운영실 비밀번호 6자리를 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: clean })
      })

      const data = await response.json().catch(() => ({}))
      setConfigured(data.configured !== false)

      if (!response.ok || !data.authenticated) {
        setMessage(data.message || '운영실 비밀번호가 맞지 않습니다.')
        setAuthenticated(false)
        return
      }

      setPassword('')

      if (shouldRedirectAfterLogin()) {
        window.location.replace(safeNextPath())
        return
      }

      setAuthenticated(true)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '운영실 인증 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await fetch('/api/ops-auth', { method: 'DELETE' }).catch(() => null)
    setAuthenticated(false)
    setPassword('')
    window.location.replace('/ops/login?next=/ops')
  }

  useEffect(() => {
    check()
  }, [])

  if (checking) {
    return (
      <main className="min-h-[70vh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
        <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D8EEE8]">
          <div className="text-2xl font-black tracking-[-0.05em]">운영실 인증 확인 중입니다.</div>
        </section>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
        <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            운영실 Admin
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em]">
            운영실 비밀번호를
            <br />
            입력해주세요.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            운영실, 실증관리, 배정관리, 파트너 관리 화면은 운영실 비밀번호가 필요합니다.
          </p>

          {!configured ? (
            <div className="mt-5 rounded-2xl bg-[#FFF1F1] p-4 text-sm font-black leading-7 text-[#8A2525] ring-1 ring-[#F3BBBB]">
              Vercel 환경변수 ANBU_OPS_PASSWORD가 설정되어야 운영실 로그인이 가능합니다.
            </div>
          ) : null}

          {message ? (
            <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              {message}
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-6 space-y-4" autoComplete="off">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#55736E]">비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                aria-label="운영실 비밀번호"
                name={inputName}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder=""
                className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-5 text-center text-3xl font-black tracking-[0.18em] text-[#173B36] outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />
            </label>

            <button
              disabled={loading || !configured}
              className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-50"
            >
              {loading ? '확인 중...' : '운영실 들어가기'}
            </button>
          </form>

          <a
            href="/"
            className="mt-4 block rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            홈으로 돌아가기
          </a>
        </section>
      </main>
    )
  }

  return (
    <>
      <div className="border-b border-[#D8EEE8] bg-[#F8FCFB] px-4 py-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="text-xs font-black text-[#637B76]">
            운영실 인증 완료
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            운영실 로그아웃
          </button>
        </div>
      </div>

      {children}
    </>
  )
}

export default OpsPasswordGate
