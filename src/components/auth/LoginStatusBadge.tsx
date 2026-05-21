'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth-client'

type LoginStatus = {
  loading: boolean
  loggedIn: boolean
  role: string | null
  name: string
}

function roleLabel(role: string | null) {
  if (role === 'guardian') return '보호자'
  if (role === 'parent') return '부모님'
  if (role === 'manager') return '케어파트너'
  if (role === 'admin') return '운영실'
  return '보호자'
}

function cleanName(value: unknown) {
  if (typeof value !== 'string') return ''
  const text = value.trim()

  if (!text) return ''
  if (text === 'guardian') return '보호자'
  if (text === 'parent') return '부모님'
  if (text === 'manager') return '케어파트너'
  if (text === 'admin') return '운영실'

  return text
}

function nameFromSession(session: Session | null) {
  if (!session) return ''

  const metadata = session.user.user_metadata || {}

  const name =
    cleanName(metadata.display_name) ||
    cleanName(metadata.full_name) ||
    cleanName(metadata.name) ||
    cleanName(metadata.nickname)

  if (name) return name

  const email = session.user.email || ''
  if (email.includes('@')) return email.split('@')[0]

  return ''
}

function roleFromSession(session: Session | null) {
  if (!session) return null

  const metadata = session.user.user_metadata || {}
  const role = cleanName(metadata.user_role || metadata.role)

  if (['guardian', 'parent', 'manager', 'admin'].includes(role)) return role

  return 'guardian'
}

function greeting(status: LoginStatus) {
  const role = status.role || 'guardian'
  const name = status.name || roleLabel(role)

  if (role === 'parent') return `${name}님 안심 연결됨`
  if (role === 'manager') return `${name}님 케어파트너 접속`
  if (role === 'admin') return `${name}님 운영실 접속`
  return `${name}님 환영합니다`
}

export function LoginStatusBadge() {
  const [status, setStatus] = useState<LoginStatus>({
    loading: true,
    loggedIn: false,
    role: null,
    name: ''
  })

  async function loadStatus() {
    let apiSession: any = null
    let supabaseSession: Session | null = null

    try {
      const response = await fetch('/api/session-lite', { cache: 'no-store' })
      const result = await response.json()

      if (result?.ok) {
        apiSession = result
      }
    } catch {
      apiSession = null
    }

    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      supabaseSession = data.session || null
    } catch {
      supabaseSession = null
    }

    const role =
      cleanName(apiSession?.role) ||
      roleFromSession(supabaseSession) ||
      null

    const name =
      cleanName(apiSession?.name) ||
      cleanName(apiSession?.parentName) ||
      nameFromSession(supabaseSession) ||
      roleLabel(role)

    setStatus({
      loading: false,
      loggedIn: Boolean(apiSession?.loggedIn || apiSession?.role || supabaseSession),
      role,
      name
    })
  }

  async function logout() {
    try {
      try {
        const supabase = createSupabaseBrowserClient()
        await supabase.auth.signOut()
      } catch {
        // Supabase 설정이 없어도 session-lite 로그아웃은 진행합니다.
      }

      await fetch('/api/session-lite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      }).catch(() => null)

      setStatus({
        loading: false,
        loggedIn: false,
        role: null,
        name: ''
      })
    } catch {
      return undefined
    }
  }

  useEffect(() => {
    let mounted = true

    async function run() {
      if (!mounted) return
      await loadStatus()
    }

    run()

    let unsubscribe: (() => void) | null = null

    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = supabase.auth.onAuthStateChange(() => {
        loadStatus()
      })

      unsubscribe = () => data.subscription.unsubscribe()
    } catch {
      unsubscribe = null
    }

    return () => {
      mounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [])

  if (status.loading) {
    return (
      <div className="rounded-full bg-[#F4FAF9] px-3 py-2 text-xs font-black text-[#7D9894] ring-1 ring-[#E3EFEC]">
        확인 중
      </div>
    )
  }

  if (!status.loggedIn) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-[#F4FAF9] px-2 py-2 text-xs font-black text-[#5B7774] ring-1 ring-[#E3EFEC]">
        <span className="hidden xl:inline">진행상태 확인 가능</span>
        <Link
          href="/signup/guardian"
          className="rounded-full bg-[#19B99A] px-3 py-1.5 text-xs font-black text-white"
        >
          로그인·가입
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-[#EAFBF6] px-3 py-2 text-xs font-black text-[#2F756B] ring-1 ring-[#CBEAE4]">
      <span className="max-w-[11rem] truncate">
        {greeting(status)}
      </span>

      <button
        type="button"
        onClick={logout}
        className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#426C68] ring-1 ring-[#DCEEEA]"
      >
        로그아웃
      </button>
    </div>
  )
}
