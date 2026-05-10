'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'

type AccessRole = 'ops' | 'manager' | 'buyer' | 'guardian'

const roleOptions: Array<{
  role: AccessRole
  label: string
  description: string
  homePath: string
  placeholder: string
}> = [
  {
    role: 'ops',
    label: '운영실',
    description: '접수함, 케어 케이스, 매니저 검증, 매칭을 관리합니다.',
    homePath: '/ops',
    placeholder: 'ops-2580'
  },
  {
    role: 'manager',
    label: '케어파트너',
    description: '일감 확인, 수락/거절, 현장 체크, 정산 예정 확인을 합니다.',
    homePath: '/manager',
    placeholder: 'manager-2580'
  },
  {
    role: 'buyer',
    label: '바이어',
    description: 'M&A·전략제휴 검토용 데모와 배포 점검 화면을 확인합니다.',
    homePath: '/buyer-demo',
    placeholder: 'buyer-2580'
  },
  {
    role: 'guardian',
    label: '보호자',
    description: '부모님 걱정 접수와 자녀앱 화면을 확인합니다.',
    homePath: '/child',
    placeholder: 'guardian-2580'
  }
]

export function AccessLoginBoard() {
  const [role, setRole] = useState<AccessRole>('ops')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [nextPath, setNextPath] = useState('/ops')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get('next')
    if (next) setNextPath(next)

    fetch('/api/access/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setCurrentRole(data.roleLabel || null))
      .catch(() => setCurrentRole(null))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    try {
      const response = await fetch('/api/access/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, code })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '입장에 실패했습니다.')
      }

      setMessage(result.message)
      window.location.href = nextPath || roleOptions.find((item) => item.role === role)?.homePath || '/'
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '입장에 실패했습니다.')
    }
  }

  async function clearAccess() {
    await fetch('/api/access/session', { method: 'DELETE' })
    setCurrentRole(null)
    setMessage('입장 권한을 초기화했습니다.')
  }

  const selected = roleOptions.find((item) => item.role === role) || roleOptions[0]

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-5xl">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="text-sm font-black text-[#19A98E]">내부 입장</div>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
            보호된 화면으로
            <br />
            입장합니다.
          </h1>
          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79]">
            정식 배포에서는 운영실, 바이어 데모, 매니저 현장 화면을 입장 코드로 보호합니다.
          </p>
        </header>

        {currentRole ? (
          <section className="mt-6 rounded-[2rem] border border-[#D5EEE8] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <div className="text-sm font-black text-[#718A87]">현재 입장 권한</div>
            <h2 className="mt-2 text-3xl font-black">{currentRole}</h2>
            <button
              onClick={clearAccess}
              className="mt-5 rounded-2xl bg-[#FFF0F1] px-5 py-4 font-black text-[#965D65]"
            >
              권한 초기화
            </button>
          </section>
        ) : null}

        <form onSubmit={submit} className="mt-6 rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
          <h2 className="text-2xl font-black">입장 역할 선택</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {roleOptions.map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => {
                  setRole(item.role)
                  setCode('')
                }}
                className={
                  'rounded-2xl p-4 text-left ring-1 transition ' +
                  (role === item.role
                    ? 'bg-[#EAFBF6] ring-[#BDE7DD]'
                    : 'bg-[#F6FCFA] ring-[#E3EFEC]')
                }
              >
                <div className="text-lg font-black">{item.label}</div>
                <p className="mt-2 text-xs font-bold leading-5 text-[#607D79]">
                  {item.description}
                </p>
              </button>
            ))}
          </div>

          <label className="mt-6 block">
            <span className="text-sm font-black text-[#486B67]">
              {selected.label} 입장 코드
            </span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={`예: ${selected.placeholder}`}
              className="mt-2 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold outline-none focus:border-[#19B99A]"
            />
          </label>

          {message ? (
            <div className="mt-5 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
              {message}
            </div>
          ) : null}

          <button className="mt-6 w-full rounded-3xl bg-[#19B99A] px-6 py-5 text-xl font-black text-white shadow-[0_18px_45px_rgba(25,185,154,0.25)]">
            입장하기
          </button>
        </form>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          {roleOptions.map((item) => (
            <Link
              key={item.homePath}
              href={item.homePath}
              className="rounded-2xl bg-white p-5 text-center font-black ring-1 ring-[#E3EFEC]"
            >
              {item.label} 화면
            </Link>
          ))}
        </section>
      </section>
    </main>
  )
}
