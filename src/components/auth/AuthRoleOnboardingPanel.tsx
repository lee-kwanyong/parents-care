'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type RoleKey = 'guardian' | 'parent' | 'provider' | 'ops'

type SessionInfo = {
  accessToken: string
  email?: string
  phone?: string
}

const roles: Array<{
  key: RoleKey
  label: string
  emoji: string
  title: string
  desc: string
  next: string
  cta: string
}> = [
  {
    key: 'guardian',
    label: '자녀·보호자',
    emoji: '👨‍👩‍👧',
    title: '부모님 상태를 확인합니다',
    desc: '부모님 연결코드를 만들고, 오늘 리포트와 문자 알림을 확인합니다.',
    next: '/onboarding?role=guardian&source=auth-role',
    cta: '보호자로 시작'
  },
  {
    key: 'parent',
    label: '부모님',
    emoji: '💚',
    title: '오늘 안부를 보냅니다',
    desc: '큰 버튼 5개로 괜찮아요, 밥, 약, 몸 상태, 도움 요청을 보냅니다.',
    next: '/onboarding?role=parent&source=auth-role',
    cta: '부모님으로 시작'
  },
  {
    key: 'provider',
    label: '생활확인 파트너',
    emoji: '🤝',
    title: '도움 요청을 확인합니다',
    desc: '요청함에서 수락, 전화 확인, 완료 기록을 처리합니다.',
    next: '/onboarding?role=provider&source=auth-role',
    cta: '파트너로 시작'
  },
  {
    key: 'ops',
    label: '운영실',
    emoji: '🖥️',
    title: '실증 운영을 관리합니다',
    desc: '운영실 한눈 홈에서 실증, 자동문자, 문자 안전정리, 가입자 전환을 봅니다.',
    next: '/portal/ops',
    cta: '운영실로 시작'
  }
]

function readSession(): SessionInfo | null {
  if (typeof window === 'undefined') return null

  const keys = Object.keys(window.localStorage)

  for (const key of keys) {
    if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) continue

    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || '{}')
      const accessToken =
        parsed.access_token ||
        parsed.currentSession?.access_token ||
        parsed.session?.access_token

      const user =
        parsed.user ||
        parsed.currentSession?.user ||
        parsed.session?.user

      if (accessToken) {
        return {
          accessToken,
          email: user?.email,
          phone: user?.phone
        }
      }
    } catch {
      continue
    }
  }

  return null
}

function destinationForRole(role: string) {
  if (role === 'guardian') return '/guardian/today'
  if (role === 'parent') return '/mobile/parent'
  if (role === 'provider') return '/provider/urgent-requests'
  if (role === 'ops') return '/portal/ops'
  return '/auth/role'
}

export function AuthRoleOnboardingPanel() {
  const params = useSearchParams()
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [selectedRole, setSelectedRole] = useState<RoleKey>('guardian')
  const [currentRole, setCurrentRole] = useState('unknown')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = useMemo(() => roles.find((item) => item.key === selectedRole) || roles[0], [selectedRole])

  async function loadCurrentUser(nextSession: SessionInfo | null) {
    if (!nextSession?.accessToken) {
      setMessage('로그인 세션을 찾지 못했습니다. 먼저 로그인한 뒤 다시 시도해주세요.')
      return
    }

    try {
      const response = await fetch('/api/auth-role', {
        headers: {
          Authorization: 'Bearer ' + nextSession.accessToken
        },
        cache: 'no-store'
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '현재 사용자 역할을 확인하지 못했습니다.')
        setDebug(JSON.stringify(data, null, 2))
        return
      }

      setCurrentRole(data.user.role || 'unknown')

      if (data.user.role && data.user.role !== 'unknown') {
        setSelectedRole(data.user.role)
        setMessage(`현재 저장된 역할은 ${data.user.roleLabel || data.user.role}입니다.`)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '현재 사용자 역할을 확인하지 못했습니다.')
    }
  }

  async function saveRole(role: RoleKey) {
    const nextSession = session || readSession()

    if (!nextSession?.accessToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('anbu_onboarding_role', role)
      }

      setMessage('로그인 세션이 없어 브라우저에만 역할을 저장했습니다. 로그인 후 다시 저장해주세요.')
      return
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/auth-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + nextSession.accessToken
        },
        body: JSON.stringify({
          role,
          source: params.get('source') || 'auth-role-page'
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        setMessage(result.message || '역할 저장에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        return
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('anbu_onboarding_role', role)
      }

      setCurrentRole(role)
      setMessage(result.message || '역할을 저장했습니다.')

      const nextUrl = role === 'ops' ? destinationForRole(role) : selected.next

      setTimeout(() => {
        window.location.href = nextUrl
      }, 700)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '역할 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const nextSession = readSession()
    setSession(nextSession)
    loadCurrentUser(nextSession)

    const roleParam = params.get('role') as RoleKey | null

    if (roleParam && roles.some((item) => item.key === roleParam)) {
      setSelectedRole(roleParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            회원가입 역할 저장
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                내 역할을 저장하고
                <br />
                바로 다음 화면으로 이동합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                역할이 저장되어야 운영실에서 보호자, 부모님, 생활확인 파트너, 운영실 계정을 구분할 수 있습니다.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#EFFFFA] px-6 py-5 text-center text-[#247A71] ring-1 ring-[#CDEFE7]">
              <div className="text-sm font-black opacity-70">현재 역할</div>
              <div className="mt-2 text-3xl font-black tracking-[-0.08em]">
                {currentRole === 'unknown' ? '미분류' : currentRole}
              </div>
              <div className="mt-2 text-xs font-bold">
                {session?.email || session?.phone || '세션 확인 중'}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            유저스푼 실증처럼 가입자가 많이 들어올 때 역할 저장이 안 되면 unknown 계정이 쌓입니다. 먼저 역할부터 저장하세요.
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
              <summary className="cursor-pointer text-sm font-black">상세 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={
                'rounded-[2rem] p-5 text-left shadow-sm ring-1 transition active:scale-[0.99] ' +
                (selectedRole === role.key
                  ? 'bg-[#247A71] text-white ring-[#247A71]'
                  : 'bg-white text-[#17443F] ring-[#D6EDE7]')
              }
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm ring-1 ring-current/10">
                {role.emoji}
              </div>

              <div className="mt-5 text-sm font-black opacity-70">{role.label}</div>
              <h2 className="mt-2 text-2xl font-black leading-tight tracking-[-0.06em]">{role.title}</h2>
              <p className="mt-3 text-sm font-bold leading-7 opacity-75">{role.desc}</p>
            </button>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-black text-[#2AA897]">선택한 역할</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">{selected.label}</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{selected.desc}</p>
            </div>

            <button
              onClick={() => saveRole(selectedRole)}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-6 py-5 text-sm font-black text-white disabled:opacity-50"
            >
              {loading ? '저장 중' : selected.cta}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/onboarding" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              가입 후 시작 화면
            </Link>
            <Link href="/login" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              로그인으로 이동
            </Link>
            <Link href="/ops/users" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 가입자센터
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}

export default AuthRoleOnboardingPanel
