'use client'

import { FormEvent, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth-client'
import { authRoleOptions, homePathForRole, normalizeKoreanPhoneNumber, type CareAuthRole } from '@/lib/auth-engine'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

type AuthMode = 'kakao' | 'phone' | 'email_magic' | 'email_password'

export function EasyAuthPanel({
  defaultMode = 'kakao',
  nextPath = '/child'
}: {
  defaultMode?: AuthMode
  nextPath?: string
}) {
  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [userRole, setUserRole] = useState<CareAuthRole>('guardian')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneForOtp, setPhoneForOtp] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function syncProfile(currentSession: Session, loginMethod: string) {
    const response = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + currentSession.access_token
      },
      body: JSON.stringify({
        displayName,
        phone,
        email,
        userRole,
        loginMethod
      })
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      throw new Error(result.message || '프로필 저장 중 오류가 발생했습니다.')
    }

    return result
  }

  async function loadSession() {
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    setSession(data.session || null)
  }

  useEffect(() => {
    loadSession()

    const supabase = createSupabaseBrowserClient()
    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  async function startKakao() {
    setSaving(true)
    setMessage('')

    try {
      const supabase = createSupabaseBrowserClient()

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(homePathForRole(userRole) || nextPath)}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account'
          }
        }
      })

      if (error) throw error

      setMessage('카카오 로그인으로 이동합니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '카카오 로그인 시작 중 오류가 발생했습니다. Supabase Kakao provider 설정을 확인해주세요.')
    } finally {
      setSaving(false)
    }
  }

  async function sendPhoneOtp() {
    setSaving(true)
    setMessage('')

    try {
      const normalizedPhone = normalizeKoreanPhoneNumber(phone)

      if (!normalizedPhone) {
        throw new Error('휴대폰 번호를 입력해주세요.')
      }

      const supabase = createSupabaseBrowserClient()

      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          data: {
            display_name: displayName,
            user_role: userRole
          }
        }
      })

      if (error) throw error

      setPhoneForOtp(normalizedPhone)
      setMessage('인증번호를 보냈습니다. 문자로 받은 번호를 입력해주세요.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '휴대폰 인증번호 발송 중 오류가 발생했습니다. Supabase SMS provider 설정을 확인해주세요.')
    } finally {
      setSaving(false)
    }
  }

  async function verifyPhoneOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const supabase = createSupabaseBrowserClient()
      const normalizedPhone = phoneForOtp || normalizeKoreanPhoneNumber(phone)

      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: phoneOtp,
        type: 'sms'
      })

      if (error) throw error
      if (!data.session) throw new Error('인증 세션을 만들지 못했습니다.')

      await syncProfile(data.session, 'phone')

      setSession(data.session)
      setMessage('휴대폰 로그인 완료. 내 화면으로 이동할 수 있습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '휴대폰 인증 확인 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function sendEmailMagic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      if (!email) throw new Error('이메일을 입력해주세요.')

      const supabase = createSupabaseBrowserClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(homePathForRole(userRole) || nextPath)}`

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            display_name: displayName,
            user_role: userRole
          },
          shouldCreateUser: true
        }
      })

      if (error) throw error

      setMessage('이메일로 로그인 링크를 보냈습니다. 메일함에서 링크를 눌러주세요.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '이메일 링크 발송 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function signUpOrSignInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      if (!email || !password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.')
      }

      const supabase = createSupabaseBrowserClient()

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              user_role: userRole
            }
          }
        })

        if (signUpError) throw signUpError

        if (signUpData.session) {
          await syncProfile(signUpData.session, 'email_password')
          setSession(signUpData.session)
          setMessage('회원가입과 로그인이 완료됐습니다.')
        } else {
          setMessage('회원가입이 접수됐습니다. 이메일 확인이 필요한 경우 메일함을 확인해주세요.')
        }

        return
      }

      if (signInData.session) {
        await syncProfile(signInData.session, 'email_password')
        setSession(signInData.session)
        setMessage('로그인이 완료됐습니다.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '이메일 로그인 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    setSession(null)
    setMessage('로그아웃했습니다.')
  }

  const homePath = homePathForRole(userRole) || nextPath

  if (session) {
    return (
      <CareCard tone="green">
        <StatusPill text="로그인 완료" tone="green" />
        <h2 className="mt-4 text-3xl font-black">로그인되었습니다.</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
          이제 부모님 걱정을 맡기거나 오늘의 안심판을 확인할 수 있습니다.
        </p>

        {message ? (
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">
            {message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <CareButton href={homePath} tone="dark" size="xl">
            내 화면으로 이동
          </CareButton>
          <button onClick={signOut} className="rounded-3xl bg-slate-100 px-6 py-5 text-lg font-black">
            로그아웃
          </button>
        </div>
      </CareCard>
    )
  }

  return (
    <div className="space-y-6">
      <CareCard tone="white">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="쉬운 로그인" tone="green" />
          <StatusPill text="카카오·휴대폰 우선" tone="slate" />
        </div>

        <h2 className="mt-4 text-3xl font-black">어떤 화면으로 시작할까요?</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
          보호자, 가족, 부모님, 매니저, 운영실에 따라 첫 화면을 다르게 열어줍니다.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {authRoleOptions.map((role) => (
            <button
              key={role.code}
              type="button"
              onClick={() => setUserRole(role.code)}
              className={
                'rounded-3xl border p-4 text-left transition ' +
                (userRole === role.code
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50 hover:bg-white')
              }
            >
              <div className="text-lg font-black">{role.label}</div>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{role.description}</p>
            </button>
          ))}
        </div>
      </CareCard>

      <CareCard tone="white">
        <h2 className="text-3xl font-black">가장 편한 방식으로 시작하세요</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ['kakao', '카카오로 시작', '가장 편한 방식'],
            ['phone', '휴대폰 번호', '문자 인증번호'],
            ['email_magic', '이메일 링크', '비밀번호 없음'],
            ['email_password', '이메일/비밀번호', '보조 수단']
          ].map(([value, title, desc]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value as AuthMode)}
              className={
                'rounded-3xl border p-4 text-left transition ' +
                (mode === value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50 hover:bg-white')
              }
            >
              <div className="text-lg font-black">{title}</div>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="tap-target rounded-2xl border border-slate-200 p-4"
            placeholder="이름. 예: 이관용"
          />

          {(mode === 'phone' || mode === 'kakao') ? (
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="tap-target rounded-2xl border border-slate-200 p-4"
              placeholder="휴대폰. 예: 010-1234-5678"
            />
          ) : (
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="tap-target rounded-2xl border border-slate-200 p-4"
              placeholder="이메일"
            />
          )}
        </div>
      </CareCard>

      {mode === 'kakao' ? (
        <CareCard tone="amber">
          <h2 className="text-3xl font-black">카카오로 시작하기</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-amber-900">
            Supabase Dashboard에서 Kakao provider를 활성화하면 바로 작동합니다. 아직 설정 전이면 이메일 링크나 휴대폰 방식을 사용하세요.
          </p>
          <div className="mt-5">
            <CareButton onClick={startKakao} disabled={saving} size="xl" className="md:w-full">
              카카오로 시작하기
            </CareButton>
          </div>
        </CareCard>
      ) : null}

      {mode === 'phone' ? (
        <CareCard tone="blue">
          <h2 className="text-3xl font-black">휴대폰 번호로 시작하기</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Supabase Phone Auth와 SMS provider가 설정되면 문자 인증번호로 로그인합니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="tap-target rounded-2xl border border-slate-200 p-4"
              placeholder="010-1234-5678"
            />
            <button onClick={sendPhoneOtp} disabled={saving} className="rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">
              인증번호 받기
            </button>
          </div>

          <form onSubmit={verifyPhoneOtp} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={phoneOtp}
              onChange={(event) => setPhoneOtp(event.target.value)}
              className="tap-target rounded-2xl border border-slate-200 p-4"
              placeholder="문자 인증번호"
            />
            <button disabled={saving} className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
              확인
            </button>
          </form>
        </CareCard>
      ) : null}

      {mode === 'email_magic' ? (
        <CareCard tone="green">
          <h2 className="text-3xl font-black">이메일 링크로 시작하기</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-emerald-900">
            비밀번호를 만들지 않아도 이메일로 받은 링크를 누르면 로그인됩니다.
          </p>

          <form onSubmit={sendEmailMagic} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="tap-target rounded-2xl border border-slate-200 p-4"
              placeholder="이메일"
            />
            <button disabled={saving} className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
              링크 받기
            </button>
          </form>
        </CareCard>
      ) : null}

      {mode === 'email_password' ? (
        <CareCard tone="white">
          <h2 className="text-3xl font-black">이메일/비밀번호</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
            운영실이나 매니저처럼 고정 계정이 필요한 경우 사용할 수 있습니다.
          </p>

          <form onSubmit={signUpOrSignInWithPassword} className="mt-5 grid gap-3">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="tap-target rounded-2xl border border-slate-200 p-4"
              placeholder="이메일"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="tap-target rounded-2xl border border-slate-200 p-4"
              placeholder="비밀번호"
              type="password"
            />
            <button disabled={saving} className="rounded-3xl bg-slate-950 px-6 py-5 text-xl font-black text-white">
              로그인 또는 회원가입
            </button>
          </form>
        </CareCard>
      ) : null}

      {message ? (
        <CareCard tone="blue">
          <p className="text-lg font-black">{message}</p>
        </CareCard>
      ) : null}
    </div>
  )
}
