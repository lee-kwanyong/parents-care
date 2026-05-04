const fs = require('fs')
const path = require('path')

const root = process.cwd()
const mustExist = ['package.json', 'src/app', 'src/components', 'src/lib']

for (const item of mustExist) {
  if (!fs.existsSync(path.join(root, item))) {
    console.error(`[step6] Missing ${item}. Run this from the project root.`)
    process.exit(1)
  }
}

const stamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
const backupDir = path.join(root, `.backup-before-step6-login-${stamp}`)
fs.mkdirSync(backupDir, { recursive: true })

function backup(rel) {
  const src = path.join(root, rel)
  if (!fs.existsSync(src)) return
  const dst = path.join(backupDir, rel)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  fs.cpSync(src, dst, { recursive: true })
}

function write(rel, content) {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
  console.log(`[step6] wrote ${rel}`)
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function ensureImport(content, statement) {
  if (content.includes(statement)) return content
  return `${statement}\n${content}`
}

function patchActions() {
  const rel = 'src/app/actions.ts'
  backup(rel)
  let content = read(rel)

  content = ensureImport(content, "import { redirect } from 'next/navigation'")
  content = ensureImport(content, "import { createServerSupabaseClient } from '@/lib/supabase/server'")

  if (content.includes('sendPhoneOtpAction') && content.includes('signInWithKakaoAction')) {
    console.log('[step6] actions already contain phone/kakao actions')
    fs.writeFileSync(path.join(root, rel), content)
    return
  }

  const append = `

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
  if (raw.startsWith('+')) return raw.replace(/[\\s-]/g, '')

  const digits = raw.replace(/\\D/g, '')
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
    redirect(\`/login/phone/verify?demo=1&phone=\${encodeURIComponent(phone)}&next=\${encodeURIComponent(next)}\`)
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
    redirect(\`/login?method=phone&error=\${encodeURIComponent(error.message)}\`)
  }

  redirect(\`/login/phone/verify?phone=\${encodeURIComponent(phone)}&next=\${encodeURIComponent(next)}\`)
}

export async function verifyPhoneOtpAction(formData: FormData) {
  const phone = step6NormalizeKoreanPhone(step6FormText(formData, 'phone'))
  const token = step6FormText(formData, 'token').replace(/\\D/g, '')
  const next = step6SafeNext(step6FormText(formData, 'next') || '/child')

  if (!phone || token.length < 4) {
    redirect(\`/login/phone/verify?phone=\${encodeURIComponent(phone)}&next=\${encodeURIComponent(next)}&error=code\`)
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
    redirect(\`/login/phone/verify?phone=\${encodeURIComponent(phone)}&next=\${encodeURIComponent(next)}&error=\${encodeURIComponent(error.message)}\`)
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
      redirectTo: \`\${step6AppUrl()}/auth/callback?next=\${encodeURIComponent(next)}\`
    }
  })

  if (error || !data.url) {
    redirect(\`/login?method=kakao&error=\${encodeURIComponent(error?.message || '카카오 로그인 주소를 만들 수 없습니다.')}\`)
  }

  redirect(data.url)
}
`

  content = `${content.trim()}\n${append}\n`
  fs.writeFileSync(path.join(root, rel), content)
}

backup('src/app/login')
backup('src/app/actions.ts')

patchActions()

write('src/app/login/page.tsx', `import Link from 'next/link'
import { sendMagicLinkAction, sendPhoneOtpAction, signInWithKakaoAction } from '@/app/actions'
import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ next?: string; reason?: string; error?: string; method?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  const next = params.next || '/child'

  const errorText =
    params.error === 'phone'
      ? '휴대폰 번호를 확인해주세요. 예: 010-1234-5678'
      : params.error === 'email'
        ? '이메일 주소를 확인해주세요.'
        : params.error === 'kakao-demo'
          ? '데모 환경입니다. Supabase 설정 후 카카오 로그인을 사용할 수 있습니다.'
          : params.error

  return (
    <AppShell
      title="보호자 로그인"
      subtitle="40대 이상 보호자 기준으로 휴대폰과 카카오를 먼저 보여줍니다. 이메일은 보조 수단입니다."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <Card>
            <CardTitle
              eyebrow="추천"
              title="휴대폰 번호로 시작하기"
              description="비밀번호도, 이메일도 필요 없습니다. 문자로 받은 인증번호만 입력하면 됩니다."
            />

            {params.reason === 'auth' ? (
              <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
                부모님 걱정을 저장하려면 먼저 보호자 확인이 필요합니다.
              </p>
            ) : null}

            {errorText ? (
              <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                {errorText}
              </p>
            ) : null}

            <form action={sendPhoneOtpAction} className="space-y-4">
              <input type="hidden" name="next" value={next} />

              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">이름</span>
                <input
                  name="displayName"
                  className="w-full rounded-2xl border border-slate-200 p-4 text-lg outline-none focus:border-care-500"
                  placeholder="예: 이관용"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">휴대폰 번호</span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  className="w-full rounded-2xl border border-slate-200 p-4 text-xl font-black tracking-wide outline-none focus:border-care-500"
                  placeholder="010-1234-5678"
                />
              </label>

              <button className="w-full rounded-3xl bg-care-600 px-6 py-5 text-xl font-black text-white hover:bg-care-700">
                문자 인증번호 받기
              </button>
            </form>
          </Card>

          <Card>
            <CardTitle
              eyebrow="간편"
              title="카카오로 시작하기"
              description="카카오 계정이 익숙한 보호자는 카카오 로그인으로 바로 시작할 수 있습니다."
            />
            <form action={signInWithKakaoAction}>
              <input type="hidden" name="next" value={next} />
              <button className="w-full rounded-3xl bg-[#FEE500] px-6 py-5 text-xl font-black text-slate-950">
                카카오로 로그인
              </button>
            </form>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              카카오 로그인은 Supabase Auth Provider에서 Kakao를 활성화한 뒤 사용할 수 있습니다.
            </p>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardTitle
              eyebrow="앱이 어려운 분"
              title="로그인 전에 전화로 맡기셔도 됩니다"
              description="우리 앱은 기능을 찾는 앱이 아니라 부모님 걱정을 맡기는 앱입니다."
            />
            <div className="grid gap-3">
              <Link href="/care-request?channel=phone" className="rounded-2xl bg-slate-100 p-5 text-lg font-black hover:bg-slate-200">
                전화로 맡기기
              </Link>
              <Link href="/care-request?channel=kakao" className="rounded-2xl bg-slate-100 p-5 text-lg font-black hover:bg-slate-200">
                카톡으로 맡기기
              </Link>
              <Link href="/care-request?channel=photo" className="rounded-2xl bg-slate-100 p-5 text-lg font-black hover:bg-slate-200">
                사진으로 맡기기
              </Link>
            </div>
          </Card>

          <Card>
            <CardTitle
              eyebrow="보조 수단"
              title="이메일로 로그인 링크 받기"
              description="업무용 이메일이 편한 보호자나 운영실은 이메일 로그인도 사용할 수 있습니다."
            />
            <form action={sendMagicLinkAction} className="space-y-4">
              <input type="hidden" name="next" value={next} />
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">이름</span>
                <input
                  name="displayName"
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-care-500"
                  placeholder="예: 이관용"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">이메일</span>
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-care-500"
                  placeholder="name@example.com"
                />
              </label>
              <button className="w-full rounded-3xl bg-slate-900 px-6 py-4 text-base font-black text-white hover:bg-slate-700">
                이메일 링크 받기
              </button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
`)

write('src/app/login/phone/verify/page.tsx', `import Link from 'next/link'
import { verifyPhoneOtpAction } from '@/app/actions'
import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'

export default async function PhoneVerifyPage({
  searchParams
}: {
  searchParams?: Promise<{ phone?: string; next?: string; error?: string; demo?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  const phone = params.phone || ''
  const next = params.next || '/child'

  const errorText =
    params.error === 'code'
      ? '인증번호를 확인해주세요.'
      : params.error

  return (
    <AppShell
      title="문자 인증번호 확인"
      subtitle="휴대폰으로 받은 숫자 6자리를 입력해주세요."
    >
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardTitle
            eyebrow={params.demo ? '데모 모드' : '휴대폰 인증'}
            title="인증번호를 입력해주세요"
            description={phone ? \`\${phone} 번호로 보낸 인증번호를 입력합니다.\` : '휴대폰 번호로 받은 인증번호를 입력합니다.'}
          />

          {errorText ? (
            <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorText}
            </p>
          ) : null}

          <form action={verifyPhoneOtpAction} className="space-y-4">
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="next" value={next} />

            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">인증번호</span>
              <input
                name="token"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={8}
                className="w-full rounded-3xl border border-slate-200 p-5 text-center text-3xl font-black tracking-[0.35em] outline-none focus:border-care-500"
                placeholder="123456"
              />
            </label>

            <button className="w-full rounded-3xl bg-care-600 px-6 py-5 text-xl font-black text-white hover:bg-care-700">
              확인하고 시작하기
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/login?method=phone" className="rounded-2xl bg-slate-100 px-4 py-3">
              번호 다시 입력
            </Link>
            <Link href="/care-request?channel=phone" className="rounded-2xl bg-care-50 px-4 py-3 text-care-800">
              앱이 어려우면 전화로 맡기기
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
`)

write('docs/step6-phone-kakao-login.md', `# STEP6 휴대폰·카카오 우선 로그인

## 제품 원칙

이 앱의 핵심 사용자는 40대 이상 보호자다. 이메일 로그인은 보조 수단이고, 우선순위는 다음과 같다.

1. 휴대폰 번호 인증
2. 카카오 로그인
3. 전화/카톡/사진으로 맡기기
4. 이메일 로그인

부모님은 가능하면 로그인시키지 않는다. 부모님 화면은 큰 글씨, 오늘 일정, 만남 암호, 자녀 전화, 도움 요청, 안전 종료 중심으로 유지한다.

## Supabase 설정

### Phone Auth

Supabase Dashboard → Authentication → Sign In / Providers → Phone 활성화

SMS Provider 설정 필요:
- Twilio
- MessageBird
- Vonage
- TextLocal 등

### Kakao Auth

Kakao Developers에서 앱 생성 후 Supabase Dashboard → Authentication → Providers → Kakao 활성화.

Kakao redirect URI:
https://<project-ref>.supabase.co/auth/v1/callback

Supabase URL Configuration:
- Site URL: http://localhost:3000
- Redirect URLs: http://localhost:3000/auth/callback
`)

console.log('')
console.log('[step6] Phone/Kakao login patch complete.')
console.log('[step6] Next commands:')
console.log('npm run typecheck')
console.log('npm run build')
console.log('npm run dev')
