'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { IntakeChannel, WorryCategory } from '@/lib/types'

const worryEnum = z.enum(['hospital', 'meal', 'medication', 'discharge', 'documents', 'recurring', 'not_sure', 'emergency'])
const channelEnum = z.enum(['phone', 'kakao', 'photo', 'simple_form'])

const worryRequestSchema = z.object({
  category: worryEnum.default('not_sure'),
  channel: channelEnum.default('phone'),
  memo: z.string().trim().min(2, '상황을 두 글자 이상 입력해주세요.').max(2000, '내용이 너무 깁니다.'),
  socialCare: z.boolean().default(false),
  contactName: z.string().trim().max(80).optional(),
  contactPhone: z.string().trim().max(80).optional()
})

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

function formText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function formBoolean(formData: FormData, key: string) {
  const value = formData.get(key)
  return value === 'on' || value === 'true' || value === '1'
}

export async function sendMagicLinkAction(formData: FormData) {
  const email = formText(formData, 'email')
  const displayName = formText(formData, 'displayName')
  const next = formText(formData, 'next') || '/child'

  if (!email || !email.includes('@')) redirect('/login?error=email')

  const supabase = await createServerSupabaseClient()
  if (!supabase) redirect(`/login/check-email?demo=1&email=${encodeURIComponent(email)}`)

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      data: { display_name: displayName || email, role: 'child' }
    }
  })

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect(`/login/check-email?email=${encodeURIComponent(email)}`)
}

export async function completeOnboardingAction(formData: FormData) {
  const familyName = formText(formData, 'familyName') || '우리 가족'
  const displayName = formText(formData, 'displayName') || '보호자'
  const supabase = await createServerSupabaseClient()
  if (!supabase) redirect('/onboarding?demo=1')

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login?next=/onboarding')

  const { error } = await supabase.rpc('bootstrap_current_user_family', {
    display_name_input: displayName,
    family_name_input: familyName
  })

  if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`)
  redirect('/child')
}

export async function createWorryRequestFormAction(formData: FormData) {
  const parsed = worryRequestSchema.safeParse({
    category: formText(formData, 'category') || 'not_sure',
    channel: formText(formData, 'channel') || 'phone',
    memo: formText(formData, 'memo'),
    socialCare: formBoolean(formData, 'socialCare'),
    contactName: formText(formData, 'contactName'),
    contactPhone: formText(formData, 'contactPhone')
  })

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || '입력 내용을 확인해주세요.'
    redirect(`/care-request?error=${encodeURIComponent(message)}`)
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) redirect('/care-request/thanks?demo=1')

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login?next=/care-request&reason=auth')

  const { data, error } = await supabase.rpc('create_care_intake_request', {
    worry_input: parsed.data.category,
    channel_input: parsed.data.channel,
    memo_input: parsed.data.memo,
    social_care_input: parsed.data.socialCare,
    contact_name_input: parsed.data.contactName || null,
    contact_phone_input: parsed.data.contactPhone || null
  })

  if (error) redirect(`/care-request?error=${encodeURIComponent(error.message)}`)
  const intakeId = Array.isArray(data) && data[0]?.intake_id ? String(data[0].intake_id) : ''
  redirect(`/care-request/thanks${intakeId ? `?id=${encodeURIComponent(intakeId)}` : ''}`)
}

export async function createWorryRequestAction(_: unknown, formData: FormData) {
  const parsed = worryRequestSchema.safeParse({
    category: formText(formData, 'category') || 'not_sure',
    channel: formText(formData, 'channel') || 'phone',
    memo: formText(formData, 'memo'),
    socialCare: formBoolean(formData, 'socialCare'),
    contactName: formText(formData, 'contactName'),
    contactPhone: formText(formData, 'contactPhone')
  })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || '입력 내용을 확인해주세요.' }

  const supabase = await createServerSupabaseClient()
  if (!supabase) return { ok: true, message: '데모 모드로 접수되었습니다.', data: parsed.data }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, message: '로그인이 필요합니다.' }

  const { data, error } = await supabase.rpc('create_care_intake_request', {
    worry_input: parsed.data.category,
    channel_input: parsed.data.channel,
    memo_input: parsed.data.memo,
    social_care_input: parsed.data.socialCare,
    contact_name_input: parsed.data.contactName || null,
    contact_phone_input: parsed.data.contactPhone || null
  })

  return error ? { ok: false, message: error.message } : { ok: true, message: '안심케어 접수가 완료되었습니다.', data }
}

export async function saveCarePassportAction(_: unknown, formData: FormData) {
  const payload = Object.fromEntries(formData.entries())
  return { ok: true, message: '케어패스포트 저장 준비 완료', data: payload }
}

export async function requestMealSupportAction(_: unknown, formData: FormData) {
  const payload = Object.fromEntries(formData.entries())
  return { ok: true, message: '안심밥상 상담 요청이 접수되었습니다.', data: payload }
}

export async function createRecurringCareAction(_: unknown, formData: FormData) {
  const payload = Object.fromEntries(formData.entries())
  return { ok: true, message: '정기진료·정기케어 상담 요청이 접수되었습니다.', data: payload }
}

export async function createPostDischargePackAction(_: unknown, formData: FormData) {
  const payload = Object.fromEntries(formData.entries())
  return { ok: true, message: '퇴원 후 7일 안심팩 상담 요청이 접수되었습니다.', data: payload }
}

export async function saveComfortPreferenceAction(_: unknown, formData: FormData) {
  const payload = Object.fromEntries(formData.entries())
  return { ok: true, message: '편의 설정이 저장되었습니다.', data: payload }
}

export type WorryFormValues = {
  category: WorryCategory
  channel: IntakeChannel
  memo: string
}


/**
 * STEP6: 40대 이상 보호자 기준 로그인
 * - 1순위: 휴대폰 번호 인증
 * - 2순위: 카카오 로그인
 * - 보조: 이메일 매직링크
 */
function step6AppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

function step6FormText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function step6NormalizeKoreanPhone(input: string) {
  const raw = input.trim()
  if (!raw) return ''
  if (raw.startsWith('+')) return raw.replace(/[\s-]/g, '')

  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('82')) return '+' + digits
  if (digits.startsWith('010')) return '+82' + digits.slice(1)
  if (digits.startsWith('011')) return '+82' + digits.slice(1)
  if (digits.startsWith('016')) return '+82' + digits.slice(1)
  if (digits.startsWith('017')) return '+82' + digits.slice(1)
  if (digits.startsWith('018')) return '+82' + digits.slice(1)
  if (digits.startsWith('019')) return '+82' + digits.slice(1)

  return raw
}

function step6SafeNext(input: string) {
  if (!input || !input.startsWith('/')) return '/child'
  if (input.startsWith('//')) return '/child'
  return input
}

export async function sendPhoneOtpAction(formData: FormData) {
  const phone = step6NormalizeKoreanPhone(step6FormText(formData, 'phone'))
  const displayName = step6FormText(formData, 'displayName')
  const next = step6SafeNext(step6FormText(formData, 'next') || '/child')

  if (!phone || !phone.startsWith('+')) {
    redirect('/login?error=phone&method=phone')
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    redirect(`/login/phone/verify?demo=1&phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}`)
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      data: {
        display_name: displayName || phone,
        role: 'child',
        preferred_login_method: 'phone'
      }
    }
  })

  if (error) {
    redirect(`/login?method=phone&error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/login/phone/verify?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}`)
}

export async function verifyPhoneOtpAction(formData: FormData) {
  const phone = step6NormalizeKoreanPhone(step6FormText(formData, 'phone'))
  const token = step6FormText(formData, 'token').replace(/\D/g, '')
  const next = step6SafeNext(step6FormText(formData, 'next') || '/child')

  if (!phone || token.length < 4) {
    redirect(`/login/phone/verify?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}&error=code`)
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    redirect(next)
  }

  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  })

  if (error) {
    redirect(`/login/phone/verify?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`)
  }

  redirect(next)
}

export async function signInWithKakaoAction(formData: FormData) {
  const next = step6SafeNext(step6FormText(formData, 'next') || '/child')
  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    redirect('/login?error=kakao-demo')
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${step6AppUrl()}/auth/callback?next=${encodeURIComponent(next)}`
    }
  })

  if (error || !data.url) {
    redirect(`/login?method=kakao&error=${encodeURIComponent(error?.message || '카카오 로그인 주소를 만들 수 없습니다.')}`)
  }

  redirect(data.url)
}

