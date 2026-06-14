'use client'

import { useState } from 'react'
import Link from 'next/link'

export function AdminAccessPanel() {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

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

  async function resetSession() {
    try {
      await fetch('/api/admin-auth', {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store'
      })
    } catch {
      // ignore
    }

    setCode('')
    setMessage('기존 로그인 세션을 초기화했습니다. 관리자 코드를 다시 입력해주세요.')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="rounded-[2.5rem] bg-white/80 p-7 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7] backdrop-blur sm:p-10">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897] ring-1 ring-[#CDEFE7]">
              AnbuWorks Admin
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
              고객 화면과
              <br />
              운영실을 분리합니다.
            </h1>

            <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-[#637B76]">
              운영실, 지자체/B2G, R&D, 스마트링, 문자·알림 기능은 Admin에서만 관리합니다.
              고객 메뉴에는 보호자와 부모님이 실제로 쓰는 화면만 남깁니다.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-xs font-black text-[#2AA897]">고객</div>
                <div className="mt-2 text-lg font-black">안부·리포트</div>
              </div>
              <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-xs font-black text-[#2AA897]">Admin</div>
                <div className="mt-2 text-lg font-black">운영·실증</div>
              </div>
              <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-xs font-black text-[#2AA897]">R&D</div>
                <div className="mt-2 text-lg font-black">스마트링</div>
              </div>
            </div>
          </section>

          <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_24px_80px_rgba(49,151,136,0.12)] ring-1 ring-[#D6EDE7] sm:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                관리자 전용
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                보안 접속
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.06em]">
              운영실 접속
            </h2>

            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
              관리자 코드를 입력하면 운영실 통합 허브로 이동합니다.
            </p>

            <label className="mt-6 block">
              <span className="text-sm font-black text-[#637B76]">관리자 코드</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') login()
                }}
                placeholder="6자리 코드 입력"
                inputMode="numeric"
                className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-5 py-5 text-xl font-black tracking-[0.16em] outline-none transition focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
                autoFocus
              />
            </label>

            {message ? (
              <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
                {message}
              </div>
            ) : null}

            <button
              onClick={login}
              disabled={loading}
              className="mt-5 w-full rounded-2xl bg-[#247A71] px-5 py-5 text-lg font-black text-white shadow-[0_14px_30px_rgba(36,122,113,0.20)] transition hover:translate-y-[-1px] disabled:opacity-50"
            >
              {loading ? '확인 중...' : '운영실 들어가기'}
            </button>

            <button
              onClick={resetSession}
              className="mt-3 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              로그인 세션 초기화
            </button>

            <Link
              href="/"
              className="mt-3 block rounded-2xl bg-[#FAFFFD] px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              고객 화면으로 돌아가기
            </Link>
          </section>
        </div>
      </section>
    </main>
  )
}

export default AdminAccessPanel
