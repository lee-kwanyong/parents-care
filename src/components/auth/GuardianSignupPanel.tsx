'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Mode = 'signup' | 'login'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createClient(url, anonKey)
}

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, '')
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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

  function saveLocalProfile(extra: Record<string, unknown> = {}) {
    window.localStorage.setItem(
      'anbu_guardian_profile',
      JSON.stringify({
        guardianName: guardianName.trim(),
        guardianPhone: normalizePhone(guardianPhone),
        guardianEmail: email.trim(),
        role: 'guardian',
        createdAt: new Date().toISOString(),
        ...extra
      })
    )
  }

  function goFamilyLink() {
    window.location.href = '/family-link'
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const cleanEmail = email.trim()
    const cleanPhone = normalizePhone(guardianPhone)

    if (mode === 'signup' && !guardianName.trim()) {
      setMessage('보호자 이름을 입력해주세요.')
      return
    }

    if (!isEmail(cleanEmail)) {
      setMessage('올바른 이메일 형식을 입력해주세요.')
      return
    }

    if (password.length < 6) {
      setMessage('비밀번호는 6자리 이상으로 입력해주세요.')
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
        saveLocalProfile({ authProvider: 'local-fallback' })
        goFamilyLink()
        return
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              role: 'guardian',
              guardian_name: guardianName.trim(),
              guardian_phone: cleanPhone
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/family-link`
          }
        })

        if (error) {
          setMessage(error.message || '회원가입 중 오류가 발생했습니다.')
          return
        }

        saveLocalProfile({ authProvider: 'email' })
        setMessage('회원가입이 완료되었습니다. 이메일 인증 설정이 켜져 있다면 메일 확인 후 진행해주세요.')
        setTimeout(goFamilyLink, 700)
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      })

      if (error) {
        setMessage(error.message || '로그인 중 오류가 발생했습니다.')
        return
      }

      saveLocalProfile({ authProvider: 'email-login' })
      goFamilyLink()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function startOAuth(provider: 'google' | 'kakao') {
    setMessage('')
    setLoading(true)

    try {
      const supabase = getSupabase()

      if (!supabase) {
        setMessage('Supabase 환경변수가 없어 소셜 로그인을 시작할 수 없습니다.')
        return
      }

      saveLocalProfile({ authProvider: provider })

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/family-link`,
          queryParams:
            provider === 'google'
              ? {
                  access_type: 'offline',
                  prompt: 'consent'
                }
              : undefined
        }
      })

      if (error) {
        setMessage(error.message || '소셜 로그인 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '소셜 로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8] sm:p-8">
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

      <h2 className="mt-6 text-3xl font-black leading-tight tracking-[-0.06em] text-[#173B36]">
        {mode === 'signup' ? '보호자 회원가입' : '보호자 로그인'}
      </h2>

      <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
        {mode === 'signup'
          ? '이메일 형식으로 가입하거나 Google/Kakao 계정으로 시작할 수 있습니다.'
          : '가입한 이메일로 로그인하거나 Google/Kakao 계정으로 계속 진행할 수 있습니다.'}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => startOAuth('google')}
          disabled={loading}
          className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-60"
        >
          <span className="inline-flex items-center justify-center gap-2" data-social-logo="google">
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0"
  >
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.52c-.24 1.26-.96 2.33-2.04 3.06l3.3 2.56c1.92-1.77 3.03-4.38 3.03-7.47 0-.73-.07-1.43-.19-2.1H12Z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.7 0 4.97-.89 6.63-2.41l-3.3-2.56c-.92.62-2.1.99-3.33.99-2.56 0-4.72-1.73-5.49-4.05H3.1v2.64A10 10 0 0 0 12 22Z"
    />
    <path
      fill="#4A90E2"
      d="M6.51 13.97A5.99 5.99 0 0 1 6.2 12c0-.68.12-1.34.31-1.97V7.39H3.1A10 10 0 0 0 2 12c0 1.61.38 3.13 1.1 4.61l3.41-2.64Z"
    />
    <path
      fill="#FBBC05"
      d="M12 5.98c1.47 0 2.79.51 3.83 1.5l2.88-2.88C16.96 2.98 14.69 2 12 2A10 10 0 0 0 3.1 7.39l3.41 2.64C7.28 7.71 9.44 5.98 12 5.98Z"
    />
  </svg>
  <span>Google로 계속하기</span>
</span>
        </button>

        <button
          type="button"
          onClick={() => startOAuth('kakao')}
          disabled={loading}
          className="rounded-2xl bg-[#FEE500] px-5 py-4 text-sm font-black text-[#3A1D1D] disabled:opacity-60"
        >
          <span className="inline-flex items-center justify-center gap-2" data-social-logo="kakao">
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0"
  >
    <rect x="2" y="2" width="20" height="20" rx="6" fill="#FEE500" />
    <path
      fill="#191919"
      d="M12 6.7c-3.46 0-6.26 2.2-6.26 4.92 0 1.75 1.15 3.29 2.88 4.16l-.73 2.67c-.06.22.18.39.37.26l3.09-2.05c.21.02.43.03.65.03 3.46 0 6.26-2.2 6.26-4.92S15.46 6.7 12 6.7Z"
    />
  </svg>
  <span>Kakao로 계속하기</span>
</span>
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#D8EEE8]" />
        <span className="text-xs font-black text-[#7A9692]">또는 이메일로 진행</span>
        <div className="h-px flex-1 bg-[#D8EEE8]" />
      </div>

      <form onSubmit={submit} className="space-y-4">
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
              inputMode="tel"
            />
          </>
        ) : null}

        <Input
          label="이메일"
          value={email}
          onChange={setEmail}
          placeholder="예: guardian@example.com"
          inputMode="email"
        />

        <PasswordInput
          label="비밀번호"
          value={password}
          onChange={setPassword}
          placeholder="6자리 이상"
        />

        {mode === 'signup' ? (
          <PasswordInput
            label="비밀번호 확인"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            placeholder="비밀번호 재입력"
          />
        ) : null}

        {message ? (
          <div className="rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            {message}
          </div>
        ) : null}

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:bg-[#9FB8B3]"
        >
          {loading
            ? '처리 중...'
            : mode === 'signup'
              ? '이메일로 보호자 회원가입'
              : '이메일로 로그인'}
        </button>
      </form>

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
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  inputMode = 'text'
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  inputMode?: 'text' | 'tel' | 'email'
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

export default GuardianSignupPanel
