'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  })
}

function safeName(user: any) {
  return (
    user?.user_metadata?.guardian_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')?.[0] ||
    '보호자'
  )
}

function saveGuardianSession(user: any, provider = 'oauth') {
  const email = user?.email || ''
  const name = safeName(user)
  const phone = user?.user_metadata?.guardian_phone || user?.phone || ''

  const profile = {
    id: user?.id || '',
    guardianName: name,
    guardianEmail: email,
    guardianPhone: phone,
    role: 'guardian',
    authProvider: provider,
    loggedIn: true,
    createdAt: new Date().toISOString()
  }

  window.localStorage.setItem('anbu_guardian_profile', JSON.stringify(profile))
  window.localStorage.setItem('anbu_login_role', 'guardian')
  window.localStorage.setItem('anbu_auth_state', 'signed-in')
  window.localStorage.setItem('parents_care_auth', JSON.stringify(profile))
  window.localStorage.setItem('anbu_current_user', JSON.stringify(profile))

  document.cookie = `anbu_login_role=guardian; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`

  if (email) {
    document.cookie = `anbu_guardian_email=${encodeURIComponent(email)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
  }

  return profile
}

async function syncSessionLite(profile: any) {
  try {
    await fetch('/api/session-lite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'guardian_login',
        role: 'guardian',
        guardianName: profile.guardianName,
        name: profile.guardianName,
        email: profile.guardianEmail,
        phone: profile.guardianPhone,
        provider: profile.authProvider
      })
    })
  } catch {
    // session-lite가 없어도 로그인 상태 저장은 유지합니다.
  }
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('로그인 정보를 확인하는 중입니다.')

  useEffect(() => {
    async function run() {
      const supabase = getSupabase()
      const url = new URL(window.location.href)
      const params = url.searchParams
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

      const next = window.localStorage.getItem('anbu_oauth_next') || '/family-link'

      const error =
        params.get('error_description') ||
        params.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error')

      if (error) {
        setMessage(error)
        return
      }

      if (!supabase) {
        setMessage('Supabase 환경변수가 없어 세션을 저장하지 못했습니다.')
        return
      }

      const code = params.get('code')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (code) {
        setMessage('인증 코드를 세션으로 저장하는 중입니다.')
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          setMessage(exchangeError.message)
          return
        }
      } else if (accessToken && refreshToken) {
        setMessage('소셜 로그인 세션을 저장하는 중입니다.')
        const { error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (setError) {
          setMessage(setError.message)
          return
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setMessage(sessionError.message)
        return
      }

      const user = data.session?.user

      if (!user) {
        setMessage('로그인 세션을 찾지 못했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      const provider =
        user.app_metadata?.provider ||
        window.localStorage.getItem('anbu_oauth_provider') ||
        'oauth'

      const profile = saveGuardianSession(user, provider)
      await syncSessionLite(profile)

      window.localStorage.removeItem('anbu_oauth_next')
      window.localStorage.removeItem('anbu_oauth_provider')

      setMessage('로그인이 완료되었습니다. 부모님 연결 화면으로 이동합니다.')
      window.location.replace(next)
    }

    run().catch((error) => {
      setMessage(error instanceof Error ? error.message : '로그인 처리 중 오류가 발생했습니다.')
    })
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-[#D8EEE8] sm:p-8">
        <div className="text-3xl font-black tracking-[-0.06em]">보호자 로그인 처리</div>
        <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">{message}</p>
      </section>
    </main>
  )
}
