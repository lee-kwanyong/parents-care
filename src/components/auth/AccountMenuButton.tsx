'use client'

import Link from 'next/link'
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
  try {
    const raw =
      window.localStorage.getItem('anbu_guardian_profile') ||
      window.localStorage.getItem('parents_care_auth') ||
      window.localStorage.getItem('anbu_current_user')

    if (!raw) return null

    const parsed = JSON.parse(raw)

    if (parsed?.loggedIn || parsed?.role === 'guardian') return parsed

    return null
  } catch {
    return null
  }
}

export function AccountMenuButton() {
  const [profile, setProfile] = useState<Profile | null>(null)

  async function refresh() {
    const localProfile = readLocalProfile()

    if (localProfile) {
      setProfile(localProfile)
      return
    }

    const supabase = getSupabase()

    if (!supabase) return

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
    }
  }

  useEffect(() => {
    refresh()

    function onAuthChanged() {
      refresh()
    }

    window.addEventListener('anbu-auth-changed', onAuthChanged)
    window.addEventListener('storage', onAuthChanged)

    return () => {
      window.removeEventListener('anbu-auth-changed', onAuthChanged)
      window.removeEventListener('storage', onAuthChanged)
    }
  }, [])

  if (!profile) return null

  return (
    <Link
      href="/account"
      className="rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#173B36] ring-1 ring-[#BEEFE3] transition hover:bg-[#DFF7F0]"
    >
      회원정보
    </Link>
  )
}

export default AccountMenuButton
