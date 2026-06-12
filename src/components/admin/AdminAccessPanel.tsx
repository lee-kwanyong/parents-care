'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function AdminAccessPanel() {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)

  async function checkSession() {
    setChecking(true)

    try {
      const response = await fetch('/api/admin-auth', {
        cache: 'no-store',
        credentials: 'include'
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.authed) {
        window.location.href = '/admin/ops'
        return
      }
    } catch {
      // 세션 확인 실패 시 로그인 화면 유지
    } finally {
      setChecking(false)
    }
  }

  async function login() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ code })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '운영실 관리자 코드가 맞지 않습니다.')
        return
      }

      window.location.href = data.redirectTo || '/admin/ops'
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '운영실 인증 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function resetAndLogin() {
    try {
      await fetch('/api/admin-auth', {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store'
      })
    } catch {
      // 무시
    }

    setMessage('기존 운영실 쿠키를 초기화했습니다. 530868을 다시 입력해주세요.')
    setCode('')
  }

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-3xl">
        <section className="rounded-[2rem] bg-white/95 p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            Admin
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-[-0.07em]">
            운영실 관리자 접속
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            운영실, 지자체/B2G, R&D, 스마트링, 문자 관련 기능은 고객 메뉴와 분리된 Admin 화면에서 관리합니다.
          </p>

          <div className="mt-6 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            운영실은 관리자 전용 화면입니다. 관리자 코드를 입력해주세요.
          </div>

          <input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') login()
            }}
            placeholder="운영실 관리자 코드"
            className="mt-5 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-lg font-black tracking-[0.08em] outline-none"
            autoFocus
          />

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              {message}
            </div>
          ) : null}

          <button
            onClick={login}
            disabled={loading || checking}
            className="mt-5 w-full rounded-2xl bg-[#247A71] px-5 py-5 text-lg font-black text-white disabled:opacity-50"
          >
            {loading || checking ? '확인 중...' : '운영실 들어가기'}
          </button>

          <button
            onClick={resetAndLogin}
            className="mt-4 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
          >
            기존 쿠키 초기화
          </button>

          <Link
            href="/"
            className="mt-4 block rounded-2xl bg-[#FAFFFD] px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
          >
            고객 화면으로 돌아가기
          </Link>
        </section>
      </section>
    </main>
  )
}

export default AdminAccessPanel
