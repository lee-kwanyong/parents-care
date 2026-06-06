'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { saveGuardianSession } from '@/components/auth/AnbuAuthPersistence'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'parents-care-auth'
    }
  })
}

export function AuthCallbackClient() {
  const [message, setMessage] = useState('로그인 처리 중입니다.')

  useEffect(() => {
    async function run() {
      const supabase = getSupabase()

      if (!supabase) {
        setMessage('Supabase 환경변수가 없습니다.')
        return
      }

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const next = params.get('next') || '/family-link'
      const error = params.get('error_description') || params.get('error')

      if (error) {
        setMessage(error)
        return
      }

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            setMessage(exchangeError.message)
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
          setMessage('로그인 세션을 찾지 못했습니다. 다시 로그인해주세요.')
          return
        }

        const meta = user.user_metadata || {}

        saveGuardianSession({
          id: user.id,
          email: user.email || '',
          name:
            typeof meta.name === 'string'
              ? meta.name
              : typeof meta.full_name === 'string'
                ? meta.full_name
                : typeof meta.guardian_name === 'string'
                  ? meta.guardian_name
                  : '보호자',
          phone: typeof meta.guardian_phone === 'string' ? meta.guardian_phone : '',
          provider: user.app_metadata?.provider || 'oauth'
        })

        setMessage('로그인이 완료되었습니다. 이동합니다.')

        window.location.replace(next)
      } catch (err) {
        setMessage(err instanceof Error ? err.message : '로그인 처리 중 오류가 발생했습니다.')
      }
    }

    run()
  }, [])

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D6EDE7]">
        <div className="text-2xl font-black">보호자 로그인 처리</div>
        <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">{message}</p>
      </section>
    </main>
  )
}

export default AuthCallbackClient
