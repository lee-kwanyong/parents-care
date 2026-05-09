import Link from 'next/link'
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
            description={phone ? `${phone} 번호로 보낸 인증번호를 입력합니다.` : '휴대폰 번호로 받은 인증번호를 입력합니다.'}
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
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">인증번호</span>
              <input
                name="token"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={8}
                className="w-full rounded-3xl border border-[#E0EFEC] p-5 text-center text-3xl font-black tracking-[0.35em] outline-none focus:border-care-500"
                placeholder="123456"
              />
            </label>

            <button className="w-full rounded-3xl bg-care-600 px-6 py-5 text-xl font-black text-[#2E504D] hover:bg-care-700">
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
