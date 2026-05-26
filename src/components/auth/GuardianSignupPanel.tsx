'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth-client'
import { getAuthCallbackUrl } from '@/lib/site-url'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

type AuthProvider = 'google' | 'kakao'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.5 14.5 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12S6.8 21.4 12 21.4c6.1 0 9.1-4.3 9.1-10.3 0-.7-.1-1.2-.2-1.7H12Z" />
      <path fill="#34A853" d="M3.7 7.4l3.2 2.3C7.8 7.7 9.7 6 12 6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.5 14.5 2.6 12 2.6c-3.6 0-6.8 2-8.3 4.8Z" />
      <path fill="#4A90E2" d="M12 21.4c2.4 0 4.5-.8 6-2.4l-2.8-2.3c-.8.6-1.8 1-3.2 1-3.8 0-5.2-2.6-5.5-3.8l-3.1 2.4c1.5 2.9 4.6 5.1 8.6 5.1Z" />
      <path fill="#FBBC05" d="M6.5 13.9c-.2-.5-.3-1.1-.3-1.9 0-.7.1-1.4.3-1.9L3.4 7.7C2.8 8.9 2.6 10.3 2.6 12c0 1.7.4 3.1.9 4.3l3-2.4Z" />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#191919" d="M12 3C6.48 3 2 6.54 2 10.9c0 2.83 1.88 5.32 4.72 6.72l-1.01 3.7a.46.46 0 0 0 .68.51l4.48-2.96c.37.04.75.06 1.13.06 5.52 0 10-3.54 10-7.9S17.52 3 12 3Z" />
    </svg>
  )
}

function getSessionName(session: Session | null, fallback = '보호자') {
  if (!session) return fallback

  const metadata = session.user.user_metadata || {}

  return (
    metadata.display_name ||
    metadata.full_name ||
    metadata.name ||
    session.user.email ||
    fallback
  )
}

export function GuardianSignupPanel() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    parentName: '어머니',
    parentPhone: ''
  })

  const [session, setSession] = useState<Session | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [saving, setSaving] = useState(false)
  const inviteRef = useRef<HTMLDivElement | null>(null)

  const inputClass =
    'h-12 w-full rounded-2xl border border-[#D6EAE4] bg-white px-4 text-[15px] font-bold text-[#173B38] outline-none placeholder:text-[#8BA5A0] focus:border-[#19B99A] focus:ring-2 focus:ring-[#C7F1E7]'

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function scrollToInvite() {
    setTimeout(() => {
      inviteRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 120)
  }

  async function loadSession(showLoginMessage = false) {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const currentSession = data.session || null

      setSession(currentSession)

      if (currentSession && showLoginMessage) {
        setAuthMessage('로그인 완료. 이제 부모님 6자리 코드를 만들 수 있습니다.')
        scrollToInvite()
      }

      if (!currentSession && showLoginMessage) {
        setAuthMessage('로그인 정보를 아직 확인하지 못했습니다. 다시 로그인하거나 새로고침해주세요.')
      }
    } catch {
      setSession(null)
      if (showLoginMessage) {
        setAuthMessage('로그인 정보를 확인하는 중 오류가 발생했습니다.')
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authDone = params.get('auth') === 'done'
    const authFailed = params.get('auth') === 'failed'

    loadSession(authDone)

    if (authFailed) {
      setAuthMessage('로그인 세션을 확인하지 못했습니다. 다시 로그인해주세요.')
    }

    const supabase = createSupabaseBrowserClient()
    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)

      if (currentSession) {
        setAuthMessage('로그인 완료. 이제 부모님 6자리 코드를 만들 수 있습니다.')
      }
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  async function syncGuardianProfile(currentSession: Session, loginMethod: string) {
    await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + currentSession.access_token
      },
      body: JSON.stringify({
        displayName: form.name || getSessionName(currentSession),
        phone: form.phone,
        email: form.email || currentSession.user.email,
        userRole: 'guardian',
        loginMethod
      })
    }).catch(() => null)
  }

  async function startOAuth(provider: AuthProvider) {
    setSaving(true)
    setAuthMessage('')
    setInviteMessage('')

    try {
      const supabase = createSupabaseBrowserClient()
      const redirectTo = getAuthCallbackUrl('/signup/guardian')

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams:
            provider === 'google'
              ? {
                  prompt: 'select_account'
                }
              : undefined
        }
      })

      if (error) throw error

      setAuthMessage(provider === 'google' ? '구글 로그인으로 이동합니다.' : '카카오 로그인으로 이동합니다.')
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : '소셜 로그인 시작 중 오류가 발생했습니다.')
      setSaving(false)
    }
  }

  async function emailSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setAuthMessage('')
    setInviteMessage('')

    try {
      if (!form.email || !form.password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.')
      }

      if (form.password.length < 8) {
        throw new Error('비밀번호는 8자 이상을 권장합니다.')
      }

      const supabase = createSupabaseBrowserClient()

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })

      if (signInError) {
        const signInMessage = signInError.message || ''

        if (/email not confirmed/i.test(signInMessage)) {
          throw new Error('이메일 확인이 필요합니다. 메일함에서 인증 링크를 눌러주세요.')
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: getAuthCallbackUrl('/signup/guardian'),
            data: {
              display_name: form.name || '보호자',
              user_role: 'guardian'
            }
          }
        })

        if (signUpError) throw signUpError

        if (signUpData.session) {
          await syncGuardianProfile(signUpData.session, 'email_password')
          setSession(signUpData.session)
          setAuthMessage('이메일 회원가입이 완료됐습니다. 이제 부모님 6자리 코드를 만들 수 있습니다.')
          scrollToInvite()
        } else {
          setAuthMessage('회원가입 확인 메일을 보냈습니다. 메일함에서 인증 링크를 누른 뒤 다시 들어오세요.')
        }

        return
      }

      if (signInData.session) {
        await syncGuardianProfile(signInData.session, 'email_password')
        setSession(signInData.session)
        setAuthMessage('로그인 완료. 이제 부모님 6자리 코드를 만들 수 있습니다.')
        scrollToInvite()
      } else {
        setAuthMessage('로그인 요청은 처리됐지만 세션을 확인하지 못했습니다. 새로고침 후 다시 확인해주세요.')
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : '이메일 회원가입/로그인 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function createParentInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setInviteMessage('')

    try {
      if (!session) {
        throw new Error('먼저 보호자 회원가입 또는 로그인을 완료해주세요.')
      }

      if (!form.phone.trim()) {
        throw new Error('보호자 휴대폰 번호를 입력해주세요.')
      }

      const response = await fetch('/api/parent-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_invite',
          guardianName: form.name || getSessionName(session),
          guardianPhone: form.phone,
          parentName: form.parentName,
          parentPhone: form.parentPhone
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '부모님 초대코드 생성 중 오류가 발생했습니다.')
      }

      setInviteCode(result.invite.invite_code)
      setInviteMessage('부모님 초대코드 생성이 완료됐습니다.')
    } catch (error) {
      setInviteMessage(error instanceof Error ? error.message : '부모님 초대코드 생성 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function copyInvite() {
    const code = inviteCode || '----'
    const message = `[부모님 안심케어] ${form.parentName || '부모님'} 전용 화면 접속 안내

아래 주소로 들어가서 6자리 코드를 입력해주세요.

부모님 접속 화면:\nhttps://parents-care.net/parent/login
접속코드: ${code}

회원가입 없이 식사, 약, 컨디션, 자녀 전화, 긴급 도움 요청을 큰 버튼으로 사용할 수 있어요.`

    try {
      await navigator.clipboard.writeText(message)
      setInviteMessage('부모님 초대 문구를 복사했습니다.')
    } catch {
      setInviteMessage(message)
    }
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    setSession(null)
    setInviteCode('')
    setAuthMessage('로그아웃했습니다.')
    setInviteMessage('')
  }

  return (
    <div className="space-y-4">
      <CareCard tone="white" className="p-4 md:p-5">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="보호자 가입" tone="green" />
          <StatusPill text="간편 시작" tone="slate" />
        </div>

        <h2 className="mt-3 text-2xl font-black md:text-3xl">
          간편하게 가입하고 바로 이용하세요!
        </h2>

        <p className="mt-2 text-sm font-bold leading-6 text-[#63807C]">
          부모님은 직접 가입하지 않으셔도 됩니다. 보호자가 가입 후 6자리 코드를 보내드리면 바로 연결됩니다.
        </p>

        {session ? (
          <div className="mt-4 rounded-2xl bg-[#EAFBF6] p-4 text-sm font-black leading-6 text-[#2F756B]">
            <div>로그인 완료</div>
            <div className="mt-1 text-[#4E6D69]">
              {getSessionName(session)}님, 이제 부모님 6자리 코드를 만들 수 있습니다.
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <button
                type="button"
                onClick={() => startOAuth('google')}
                disabled={saving}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#24423F] ring-1 ring-[#DDEEEA] disabled:opacity-60"
              >
                <GoogleIcon />
                Google로 시작하기
              </button>

              <button
                type="button"
                onClick={() => startOAuth('kakao')}
                disabled={saving}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#FEE500] px-4 text-sm font-black text-[#191919] disabled:opacity-60"
              >
                <KakaoIcon />
                카카오로 시작하기
              </button>
            </div>

            <form onSubmit={emailSignup} className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="보호자 이름" value={form.name} onChange={(value) => update('name', value)} placeholder="예: 홍길동" inputClass={inputClass} />
                <Input label="보호자 휴대폰" value={form.phone} onChange={(value) => update('phone', value)} placeholder="010-0000-0000" inputClass={inputClass} />
                <Input label="이메일" value={form.email} onChange={(value) => update('email', value)} placeholder="email@example.com" type="email" inputClass={inputClass} />
                <Input label="비밀번호" value={form.password} onChange={(value) => update('password', value)} placeholder="8자 이상 권장" type="password" inputClass={inputClass} />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="h-12 w-full rounded-2xl bg-[#19B99A] px-4 text-base font-black text-white shadow-[0_12px_30px_rgba(25,185,154,0.20)] disabled:opacity-60"
              >
                {saving ? '처리 중...' : '이메일로 회원가입 / 로그인'}
              </button>
            </form>
          </>
        )}

        {authMessage ? (
          <div className="mt-4 rounded-2xl bg-[#FFF5DF] p-3 text-sm font-black leading-6 text-[#886B35]">
            {authMessage}
          </div>
        ) : null}

        {session ? (
          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            <button
              type="button"
              onClick={scrollToInvite}
              className="rounded-2xl bg-[#19B99A] px-4 py-3 text-sm font-black text-white"
            >
              부모님 코드 만들기
            </button>
            <button
              type="button"
              onClick={signOut}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-[#426C68]"
            >
              로그아웃
            </button>
          </div>
        ) : null}
      </CareCard>

      <div ref={inviteRef}>
        <CareCard tone={session ? 'green' : 'amber'} className="p-4 md:p-5">
          <div className="flex flex-wrap gap-2">
            <StatusPill text="부모님 초대" tone="green" />
            <StatusPill text="6자리 코드" tone="slate" />
          </div>

          <h2 className="mt-3 text-2xl font-black md:text-3xl">
            부모님은 6자리 코드만 입력합니다.
          </h2>

          <p className="mt-2 text-sm font-bold leading-6 text-[#63807C]">
            보호자 가입이 끝나면 부모님 전용 6자리 초대코드를 만들 수 있습니다.
          </p>

          <form onSubmit={createParentInvite} className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {session ? (
                <Input label="보호자 휴대폰" value={form.phone} onChange={(value) => update('phone', value)} placeholder="010-0000-0000" inputClass={inputClass} />
              ) : null}
              <Input label="부모님 호칭" value={form.parentName} onChange={(value) => update('parentName', value)} placeholder="예: 어머니" inputClass={inputClass} />
              <Input label="부모님 휴대폰" value={form.parentPhone} onChange={(value) => update('parentPhone', value)} placeholder="010-0000-0000" inputClass={inputClass} />
            </div>

            {inviteCode ? (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-[#D3ECE6]">
                <div className="text-sm font-black text-[#2F756B]">부모님 6자리 접속코드</div>
                <div className="mt-1 text-4xl font-black tracking-widest text-[#193B38]">
                  {inviteCode}
                </div>
                <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                  부모님은 회원가입 없이 ‘부모님 접속 화면’에서 이 6자리 코드만 입력하면 연결됩니다.
                </p>
              </div>
            ) : null}

            {inviteMessage ? (
              <div className="rounded-2xl bg-[#FFF5DF] p-3 text-sm font-black leading-6 text-[#886B35]">
                {inviteMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving || !session}
              className="h-12 w-full rounded-2xl bg-[#193B38] px-4 text-base font-black text-white shadow-[0_12px_30px_rgba(25,59,56,0.16)] disabled:opacity-50"
            >
              {saving ? '생성 중...' : '부모님 6자리 코드 생성'}
            </button>
          </form>

          {inviteCode ? (
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <button
                type="button"
                onClick={copyInvite}
                className="rounded-2xl bg-[#19B99A] px-4 py-3 text-sm font-black text-white"
              >
                초대 문구 복사
              </button>

              <Link
                href="/care-request"
                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
              >
                안심케어 신청
              </Link>

              <Link
                href="/child/matching"
                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
              >
                매칭 확인
              </Link>
            </div>
          ) : null}
        </CareCard>
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  inputClass,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  inputClass: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-[#4E6D69]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  )
}
