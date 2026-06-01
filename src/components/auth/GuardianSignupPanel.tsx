'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Mode = 'signup' | 'login'

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

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, '')
}

function saveGuardianProfile(input: {
  name: string
  phone: string
  email: string
  provider: string
}) {
  if (typeof window === 'undefined') return

  const profile = {
    role: 'guardian',
    loggedIn: true,
    guardianName: input.name || '보호자',
    guardianPhone: input.phone,
    guardianEmail: input.email,
    provider: input.provider,
    savedAt: new Date().toISOString()
  }

  window.localStorage.setItem('anbu_login_role', 'guardian')
  window.localStorage.setItem('anbu_auth_state', 'signed-in')
  window.localStorage.setItem('anbu_guardian_profile', JSON.stringify(profile))
  window.localStorage.setItem('anbu_current_user', JSON.stringify(profile))
  window.dispatchEvent(new CustomEvent('anbu-auth-changed', { detail: profile }))
}

export function GuardianSignupPanel() {
  const [mode, setMode] = useState<Mode>('signup')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function startOAuth(provider: 'google' | 'kakao') {
    setMessage('')
    setLoading(true)

    try {
      const supabase = getSupabase()

      if (!supabase) {
        setMessage('Supabase 로그인 설정을 확인해주세요.')
        return
      }

      window.localStorage.setItem('anbu_login_role', 'guardian')
      window.localStorage.setItem('anbu_auth_next', '/family-link')

      const redirectTo = `${window.location.origin}/auth/callback?next=/family-link`

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo
        }
      })

      if (error) {
        setMessage(error.message)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '소셜 로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const cleanPhone = normalizePhone(guardianPhone)

    if (mode === 'signup' && !guardianName.trim()) {
      setMessage('보호자 이름을 입력해주세요.')
      return
    }

    if (!email.includes('@')) {
      setMessage('이메일 형식으로 입력해주세요.')
      return
    }

    if (password.length < 6) {
      setMessage('비밀번호는 6자리 이상 입력해주세요.')
      return
    }

    if (mode === 'signup' && password !== passwordConfirm) {
      setMessage('비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabase()

      if (!supabase) {
        setMessage('Supabase 로그인 설정을 확인해주세요.')
        return
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'guardian',
              guardian_name: guardianName,
              guardian_phone: cleanPhone
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/family-link`
          }
        })

        if (error) {
          setMessage(error.message)
          return
        }

        saveGuardianProfile({
          name: guardianName,
          phone: cleanPhone,
          email,
          provider: 'email'
        })

        setMessage('보호자 회원가입이 완료되었습니다. 부모님 연결 화면으로 이동합니다.')

        setTimeout(() => {
          window.location.href = '/family-link'
        }, 500)

        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setMessage(error.message)
        return
      }

      saveGuardianProfile({
        name: guardianName || '보호자',
        phone: cleanPhone,
        email,
        provider: 'email'
      })

      setMessage('보호자 로그인이 완료되었습니다. 부모님 연결 화면으로 이동합니다.')

      setTimeout(() => {
        window.location.href = '/family-link'
      }, 500)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DFF7F0] text-2xl">
              ♡
            </div>

            <div>
              <div className="text-lg font-black tracking-[-0.05em] text-[#173B36]">
                부모님 안심케어
              </div>
              <div className="text-xs font-bold text-[#5F7D77]">
                by 안부웍스 · AI 안부확인
              </div>
            </div>
          </div>

          <div className="mt-8 inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            보호자 회원가입
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            이메일 또는 소셜 로그인으로
            <br />
            보호자를 등록합니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            보호자 가입 후 부모님 정보를 입력하면 6자리 연결코드가 생성됩니다.
            부모님은 별도 회원가입 없이 6자리 코드만 입력하면 됩니다.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StepCard number="1" title="보호자 가입" />
            <StepCard number="2" title="부모님 연결코드 생성" />
            <StepCard number="3" title="부모님 코드 입력" />
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-7">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={
                'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                (mode === 'signup'
                  ? 'bg-[#193B38] text-white ring-[#193B38]'
                  : 'bg-white text-[#173B36] ring-[#D8EEE8]')
              }
            >
              이메일 회원가입
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className={
                'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                (mode === 'login'
                  ? 'bg-[#193B38] text-white ring-[#193B38]'
                  : 'bg-white text-[#173B36] ring-[#D8EEE8]')
              }
            >
              이메일 로그인
            </button>
          </div>

          <h2 className="mt-6 text-3xl font-black tracking-[-0.07em]">
            보호자 {mode === 'signup' ? '회원가입' : '로그인'}
          </h2>

          <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
            이메일 형식으로 가입하거나 Google/Kakao 계정으로 시작할 수 있습니다.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => startOAuth('google')}
              disabled={loading}
              className="flex items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl font-black text-[#4285F4] ring-1 ring-[#E5E5E5]">
                G
              </span>
              Google로 계속하기
            </button>

            <button
              type="button"
              onClick={() => startOAuth('kakao')}
              disabled={loading}
              className="flex items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-5 py-4 text-sm font-black text-[#191919] disabled:opacity-60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#191919] text-sm font-black text-[#FEE500]">
                ●
              </span>
              Kakao로 계속하기
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#D8EEE8]" />
            <div className="text-xs font-black text-[#7A9692]">또는 이메일로 진행</div>
            <div className="h-px flex-1 bg-[#D8EEE8]" />
          </div>

          <form onSubmit={submitEmail} className="space-y-4">
            {mode === 'signup' ? (
              <>
                <Input
                  label="보호자 이름"
                  value={guardianName}
                  onChange={setGuardianName}
                  placeholder="예: 홍길동"
                />

                <Input
                  label="휴대폰 번호"
                  value={guardianPhone}
                  onChange={setGuardianPhone}
                  placeholder="예: 010-0000-0000"
                />
              </>
            ) : null}

            <Input
              label="이메일"
              value={email}
              onChange={setEmail}
              placeholder="예: guardian@example.com"
              type="email"
            />

            <Input
              label="비밀번호"
              value={password}
              onChange={setPassword}
              placeholder="6자리 이상"
              type="password"
            />

            {mode === 'signup' ? (
              <Input
                label="비밀번호 확인"
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                placeholder="비밀번호 재입력"
                type="password"
              />
            ) : null}

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-60"
            >
              {loading
                ? '처리 중...'
                : mode === 'signup'
                  ? '이메일로 보호자 회원가입'
                  : '이메일로 로그인'}
            </button>
          </form>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              {message}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              역할 선택으로 돌아가기
            </Link>

            <Link
              href="/parent/login"
              className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              부모님 코드 입력
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}

function StepCard({ number, title }: { number: string; title: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8FAF5] text-sm font-black text-[#11977F]">
        {number}
      </div>
      <div className="mt-3 text-sm font-black text-[#173B36]">
        {title}
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-bold text-[#173B36] outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

export default GuardianSignupPanel
