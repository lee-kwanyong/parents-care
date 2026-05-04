import Link from 'next/link'
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
