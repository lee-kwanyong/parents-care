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
      className="inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-3 ring-1 ring-[#D8EEE8] transition hover:bg-white"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DFF7F0] text-[#173B36] shadow-sm">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
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

      <span className="flex flex-col leading-none">
        <span className="text-xl font-black tracking-[-0.05em] text-[#173B36]">
          부모님 안심케어
        </span>
        <span className="mt-1 text-xs font-bold text-[#5F7D77]">
          by 안부웍스 · AI 안부확인
        </span>
      </span>
    </Link>
  )
}

export default function GuardianSignupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-start">
          <BrandLogo />
        </header>

        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            보호자 회원가입
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            이메일 또는 소셜 로그인으로
            <br />
            보호자를 등록합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76]">
            보호자 가입 후 부모님 정보를 입력하면 6자리 연결코드가 생성됩니다.
            부모님은 별도 회원가입 없이 6자리 코드만 입력하면 됩니다.
          </p>
        </section>

        <GuardianSignupPanel />
      </section>
    </main>
  )
}
