'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Profile = {
  id?: string
  guardianName?: string
  guardianEmail?: string
  guardianPhone?: string
  role?: string
  authProvider?: string
  loggedIn?: boolean
  createdAt?: string
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  })
}

function readLocalProfile(): Profile | null {
  try {
    const raw =
      window.localStorage.getItem('anbu_guardian_profile') ||
      window.localStorage.getItem('parents_care_auth') ||
      window.localStorage.getItem('anbu_current_user')

    if (!raw) return null

    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearAuthStorage() {
  const keys = [
    'anbu_guardian_profile',
    'anbu_login_role',
    'anbu_auth_state',
    'parents_care_auth',
    'anbu_current_user',
    'anbu_oauth_next',
    'anbu_oauth_provider'
  ]

  for (const key of keys) {
    window.localStorage.removeItem(key)
  }

  document.cookie = 'anbu_login_role=; path=/; max-age=0'
  document.cookie = 'anbu_guardian_email=; path=/; max-age=0'
}

export function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)

    const localProfile = readLocalProfile()

    if (localProfile) {
      setProfile(localProfile)
    }

    const supabase = getSupabase()

    if (supabase) {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (user) {
        const nextProfile = {
          id: user.id,
          guardianName:
            user.user_metadata?.guardian_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')?.[0] ||
            '보호자',
          guardianEmail: user.email || '',
          guardianPhone: user.user_metadata?.guardian_phone || user.phone || '',
          role: 'guardian',
          authProvider: user.app_metadata?.provider || 'supabase',
          loggedIn: true,
          createdAt: new Date().toISOString()
        }

        window.localStorage.setItem('anbu_guardian_profile', JSON.stringify(nextProfile))
        setProfile(nextProfile)
      }
    }

    setLoading(false)
  }

  async function logout() {
    setMessage('로그아웃 중입니다.')

    const supabase = getSupabase()

    if (supabase) {
      await supabase.auth.signOut()
    }

    clearAuthStorage()

    setMessage('로그아웃되었습니다.')
    window.location.href = '/login'
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-5 py-8 text-[#17443F]">
      <section className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            회원정보
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-[-0.07em] sm:text-5xl">
            보호자 회원정보
          </h1>

          <p className="mt-4 text-base font-bold leading-7 text-[#637B76]">
            로그인 상태와 보호자 정보를 확인합니다.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
          {loading ? (
            <p className="text-sm font-bold text-[#637B76]">회원정보를 불러오는 중입니다.</p>
          ) : profile?.loggedIn || profile?.role === 'guardian' ? (
            <div className="space-y-4">
              <InfoRow label="이름" value={profile.guardianName || '보호자'} />
              <InfoRow label="이메일" value={profile.guardianEmail || '-'} />
              <InfoRow label="연락처" value={profile.guardianPhone || '-'} />
              <InfoRow label="권한" value="보호자" />
              <InfoRow label="로그인 방식" value={profile.authProvider || 'unknown'} />

              {message ? (
                <div className="rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black text-[#2AA897] ring-1 ring-[#CDEFE7]">
                  {message}
                </div>
              ) : null}

              <div className="grid gap-3 pt-4 sm:grid-cols-3">
                <Link
                  href="/family-link"
                  className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white"
                >
                  부모님 연결코드
                </Link>

                <Link
                  href="/child/dashboard"
                  className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  보호자 대시보드
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="rounded-2xl bg-[#FFF4F4] px-5 py-4 text-center text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8]"
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-bold leading-7 text-[#637B76]">
                아직 보호자 로그인 정보가 없습니다. 보호자 회원가입 또는 로그인을 먼저 진행해주세요.
              </p>

              <Link
                href="/signup/guardian"
                className="inline-flex rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white"
              >
                보호자 로그인/회원가입
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
      <div className="text-xs font-black text-[#7A9692]">{label}</div>
      <div className="mt-2 break-words text-lg font-black text-[#17443F]">{value}</div>
    </div>
  )
}

export default AccountPage
