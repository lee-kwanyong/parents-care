import { GuardianSignupPanel } from '@/components/auth/GuardianSignupPanel'

export const metadata = {
  title: '보호자 회원가입 | 부모님 안심케어',
  description: '보호자 회원가입 후 부모님 연결코드를 생성합니다.'
}

export default function GuardianSignupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            보호자 회원가입
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            보호자가 먼저 가입하고,
            <br />
            부모님 연결코드를 만듭니다.
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
