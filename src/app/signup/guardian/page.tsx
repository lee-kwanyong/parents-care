import Link from 'next/link'
import { GuardianSignupPanel } from '@/components/auth/GuardianSignupPanel'

export const metadata = {
  title: '보호자 회원가입 | 부모님 안심케어',
  description: '이메일, Google, Kakao로 보호자 회원가입을 진행합니다.'
}

function BrandLogo() {
  return (
    <Link
      href="/"
      className="inline-flex max-w-full items-center gap-3 rounded-full bg-white/90 px-3 py-2 ring-1 ring-[#D8EEE8] transition hover:bg-white sm:px-4 sm:py-3"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#DFF7F0] text-[#173B36] shadow-sm sm:h-12 sm:w-12">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 sm:h-7 sm:w-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 21s-6.716-4.33-9.193-8.242C.938 9.82 2.12 6 5.76 6c2.017 0 3.2 1.07 4.01 2.147C10.58 7.07 11.763 6 13.78 6c3.64 0 4.822 3.82 2.953 6.758C18.257 16.67 12 21 12 21Z" />
        </svg>
      </span>

      <span className="min-w-0 leading-none">
        <span className="block truncate text-base font-black tracking-[-0.05em] text-[#173B36] sm:text-xl">
          부모님 안심케어
        </span>
        <span className="mt-1 block truncate text-[11px] font-bold text-[#5F7D77] sm:text-xs">
          by 안부웍스 · AI 안부확인
        </span>
      </span>
    </Link>
  )
}

export default function GuardianSignupPage() {
  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-4 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <header className="flex items-center justify-start">
          <BrandLogo />
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1fr] lg:items-start">
          <div className="order-2 rounded-[1.75rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8 lg:order-1">
            <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
              보호자 회원가입
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight tracking-[-0.07em] sm:mt-5 sm:text-5xl">
              이메일 또는 소셜 로그인으로
              <br className="hidden sm:block" />
              보호자를 등록합니다.
            </h1>

            <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
              보호자 가입 후 부모님 정보를 입력하면 6자리 연결코드가 생성됩니다.
              부모님은 별도 회원가입 없이 6자리 코드만 입력하면 됩니다.
            </p>

            <div className="mt-5 grid gap-3 text-sm font-bold text-[#637B76]">
              <div className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                1. 보호자 회원가입 또는 로그인
              </div>
              <div className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                2. 부모님 연결코드 생성
              </div>
              <div className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                3. 부모님이 6자리 코드 입력
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <GuardianSignupPanel />
          </div>
        </section>
      </section>
    </main>
  )
}
