'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CareCard } from '@/components/ui/CareCard'
import { CareButton } from '@/components/ui/CareButton'
import { StatusPill } from '@/components/ui/StatusPill'

type Role = 'parent' | 'child' | 'manager' | 'ops'

const roles: Array<{
  code: Role
  title: string
  desc: string
  emoji: string
  home: string
}> = [
  {
    code: 'parent',
    title: '부모님',
    desc: '오늘 안심 확인, 자녀 전화, 긴급 도움 요청',
    emoji: '👵',
    home: '/parent/today'
  },
  {
    code: 'child',
    title: '자녀/보호자',
    desc: '안심케어 신청, 보호자 리포트 확인',
    emoji: '👨‍👩‍👧',
    home: '/care-request'
  },
  {
    code: 'manager',
    title: '매니저',
    desc: '제안 확인, 수락/거절, 현장 시작/완료',
    emoji: '🧑‍⚕️',
    home: '/manager'
  },
  {
    code: 'ops',
    title: '운영실',
    desc: '접수, 매칭, 매니저 승인, 운영 관리',
    emoji: '🧭',
    home: '/ops'
  }
]

function normalizeRole(value: string | null): Role {
  if (value === 'parent') return 'parent'
  if (value === 'manager') return 'manager'
  if (value === 'ops') return 'ops'
  return 'child'
}

function safeNext(value: string | null) {
  if (!value) return ''
  if (!value.startsWith('/')) return ''
  if (value.startsWith('//')) return ''
  return value
}

export function RoleAccessPanel() {
  const searchParams = useSearchParams()
  const [role, setRole] = useState<Role>(() => normalizeRole(searchParams.get('role')))
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [session, setSession] = useState<{
    loggedIn: boolean
    role: Role | null
    home: string | null
  }>({
    loggedIn: false,
    role: null,
    home: null
  })

  const selectedRole = useMemo(() => {
    return roles.find((item) => item.code === role) || roles[1]
  }, [role])

  const nextPath = safeNext(searchParams.get('next')) || selectedRole.home

  async function loadSession() {
    try {
      const response = await fetch('/api/role-session', { cache: 'no-store' })
      const result = await response.json()

      if (result.ok) {
        setSession({
          loggedIn: Boolean(result.loggedIn),
          role: result.role,
          home: result.home
        })
      }
    } catch {
      return undefined
    }
  }

  useEffect(() => {
    loadSession()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/role-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, code })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '접속 중 오류가 발생했습니다.')
      }

      window.location.href = nextPath || result.home || selectedRole.home
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '접속 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    setSaving(true)
    setMessage('')

    try {
      await fetch('/api/role-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      })

      setSession({
        loggedIn: false,
        role: null,
        home: null
      })
      setMessage('로그아웃했습니다.')
    } catch {
      setMessage('로그아웃 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (session.loggedIn) {
    const current = roles.find((item) => item.code === session.role)

    return (
      <CareCard tone="green">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="접속 완료" tone="green" />
          <StatusPill text={current?.title || '사용자'} tone="slate" />
        </div>

        <h2 className="mt-4 text-3xl font-black">
          {current?.title || '사용자'} 화면으로 접속되어 있습니다.
        </h2>

        <p className="mt-3 text-sm font-bold leading-6 text-[#4E6D69]">
          다른 역할로 들어가려면 로그아웃 후 다시 접속 코드를 입력하세요.
        </p>

        {message ? (
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-[#4E6D69]">
            {message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <CareButton href={session.home || current?.home || '/app'} tone="dark" size="xl">
            내 화면으로 이동
          </CareButton>
          <button
            type="button"
            onClick={logout}
            disabled={saving}
            className="rounded-3xl bg-white px-6 py-5 text-lg font-black text-[#426C68] ring-1 ring-[#CFE7E2] disabled:opacity-60"
          >
            로그아웃
          </button>
        </div>
      </CareCard>
    )
  }

  return (
    <CareCard tone="white">
      <div className="flex flex-wrap gap-2">
        <StatusPill text="베타 접속" tone="green" />
        <StatusPill text="역할별 화면 분리" tone="slate" />
      </div>

      <h2 className="mt-4 text-3xl font-black">
        어떤 앱으로 들어가시나요?
      </h2>

      <p className="mt-2 text-sm font-bold leading-6 text-[#63807C]">
        부모님, 자녀, 매니저, 운영실이 각자 다른 화면을 사용합니다. 운영실에서 받은 접속 코드를 입력하세요.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          {roles.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setRole(item.code)}
              className={
                'rounded-3xl border p-4 text-left transition ' +
                (role === item.code
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-[#E0EFEC] bg-slate-50 hover:bg-white')
              }
            >
              <div className="text-3xl">{item.emoji}</div>
              <div className="mt-3 text-lg font-black">{item.title}</div>
              <p className="mt-2 text-xs font-bold leading-5 text-[#63807C]">
                {item.desc}
              </p>
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[#4E6D69]">
            접속 코드
          </span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full rounded-2xl border border-[#E0EFEC] p-4 text-lg font-black outline-none focus:border-emerald-500"
            placeholder="운영실에서 받은 접속 코드"
          />
        </label>

        {message ? (
          <div className="rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-3xl bg-[#19B99A] px-6 py-5 text-xl font-black text-white shadow-[0_18px_45px_rgba(25,185,154,0.25)] disabled:opacity-60"
        >
          {saving ? '접속 중...' : `${selectedRole.title} 앱으로 들어가기`}
        </button>
      </form>
    </CareCard>
  )
}
