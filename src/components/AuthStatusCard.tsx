'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth-client'
import { displayPhone, homePathForRole, labelAuthRole, type CareAuthProfile } from '@/lib/auth-engine'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

export function AuthStatusCard() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<CareAuthProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const currentSession = data.session || null

      setSession(currentSession)

      if (currentSession?.access_token) {
        const response = await fetch('/api/auth/profile', {
          headers: {
            Authorization: 'Bearer ' + currentSession.access_token
          },
          cache: 'no-store'
        })

        const result = await response.json()

        if (response.ok && result.ok) {
          setProfile(result.profile || null)
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '로그인 상태 확인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  useEffect(() => {
    load()

    const supabase = createSupabaseBrowserClient()
    const { data } = supabase.auth.onAuthStateChange(() => {
      load()
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <CareCard>
        <p className="text-lg font-black">로그인 상태를 확인하는 중...</p>
      </CareCard>
    )
  }

  if (!session) {
    return (
      <CareCard tone="amber">
        <StatusPill text="로그인 필요" tone="amber" />
        <h2 className="mt-4 text-3xl font-black">아직 로그인하지 않았습니다.</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-[#4E6D69]">
          카카오, 휴대폰, 이메일 링크 중 편한 방식으로 시작할 수 있습니다.
        </p>
        <div className="mt-5">
          <CareButton href="/login" size="xl">
            로그인하기
          </CareButton>
        </div>
      </CareCard>
    )
  }

  const role = profile?.user_role || 'guardian'

  return (
    <CareCard tone="green">
      <div className="flex flex-wrap gap-2">
        <StatusPill text="로그인됨" tone="green" />
        <StatusPill text={labelAuthRole(role)} tone="slate" />
      </div>

      <h2 className="mt-4 text-3xl font-black">
        {profile?.display_name || session.user.email || '사용자'}님
      </h2>

      <div className="mt-4 space-y-2 text-sm font-bold leading-6 text-[#4E6D69]">
        <p>이메일: {session.user.email || profile?.email || '없음'}</p>
        <p>전화번호: {displayPhone(profile?.phone || session.user.phone)}</p>
        <p>로그인 방식: {profile?.preferred_login_method || 'easy'}</p>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <CareButton href={homePathForRole(role)} tone="dark">
          내 화면으로 이동
        </CareButton>
        <button onClick={signOut} className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
          로그아웃
        </button>
      </div>
    </CareCard>
  )
}
