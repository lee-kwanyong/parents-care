'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Profile = {
  guardianName?: string
  guardianEmail?: string
  role?: string
  loggedIn?: boolean
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
  if (typeof window === 'undefined') return null

  try {
    const raw =
      window.localStorage.getItem('anbu_guardian_profile') ||
      window.localStorage.getItem('parents_care_auth') ||
      window.localStorage.getItem('anbu_current_user')

    if (!raw) return null

    const parsed = JSON.parse(raw)

    if (parsed?.loggedIn || parsed?.role === 'guardian') {
      return parsed
    }

    return null
  } catch {
    return null
  }
}

function shouldHide(pathname: string) {
  return (
    pathname === '/login' ||
    pathname === '/signup/guardian' ||
    pathname === '/account' ||
    pathname === '/ops/login' ||
    pathname.startsWith('/parent/login')
  )
}

export function MobileLoginButton() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ready, setReady] = useState(false)

  async function refresh() {
    const localProfile = readLocalProfile()

    if (localProfile) {
      setProfile(localProfile)
      setReady(true)
      return
    }

    const supabase = getSupabase()

    if (!supabase) {
      setProfile(null)
      setReady(true)
      return
    }

    try {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (user) {
        const nextProfile = {
          guardianName:
            user.user_metadata?.guardian_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')?.[0] ||
            '보호자',
          guardianEmail: user.email || '',
          role: 'guardian',
          loggedIn: true
        }

        window.localStorage.setItem('anbu_guardian_profile', JSON.stringify(nextProfile))
        window.localStorage.setItem('anbu_login_role', 'guardian')
        window.localStorage.setItem('anbu_auth_state', 'signed-in')

        setProfile(nextProfile)
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    } finally {
      setReady(true)
    }
  }

  useEffect(() => {
    refresh()

    function onChanged() {
      refresh()
    }

    window.addEventListener('anbu-auth-changed', onChanged)
    window.addEventListener('storage', onChanged)

    return () => {
      window.removeEventListener('anbu-auth-changed', onChanged)
      window.removeEventListener('storage', onChanged)
    }
  }, [])

  if (!ready) return null
  if (shouldHide(pathname || '')) return null

  const isLoggedIn = Boolean(profile?.loggedIn || profile?.role === 'guardian')

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-3 z-[80] px-4 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="pointer-events-auto mx-auto max-w-sm rounded-[1.4rem] bg-white/95 p-2 shadow-[0_12px_35px_rgba(20,82,70,0.18)] ring-1 ring-[#D8EEE8] backdrop-blur">
        {isLoggedIn ? (
          <Link
            href="/account"
            className="flex w-full items-center justify-center rounded-[1.1rem] bg-[#193B38] px-5 py-4 text-base font-black text-white"
          >
            회원정보
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-[1.1rem] bg-[#193B38] px-5 py-4 text-base font-black text-white"
          >
            로그인 / 회원가입
          </Link>
        )}
      </div>
    </div>
  )
}

export default MobileLoginButton
