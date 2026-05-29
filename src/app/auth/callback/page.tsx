'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createClient(url, anonKey)
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('로그인 정보를 확인하는 중입니다.')

  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next') || '/family-link'
      const code = params.get('code')
      const error = params.get('error_description') || params.get('error')

      if (error) {
        setMessage(error)
        return
      }

      const supabase = getSupabase()

      if (!supabase) {
        window.location.replace(next)
        return
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          setMessage(exchangeError.message)
          return
        }
      }

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
