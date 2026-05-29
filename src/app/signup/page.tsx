import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

export default function SignupPage() {
  return (
    <AppFrame title="회원가입" subtitle="보호자와 케어파트너는 가입 방식이 다릅니다">
      <section className="mx-auto max-w-5xl">
        <CareCard tone="green">
          <div className="flex flex-wrap gap-2">
            <StatusPill text="회원가입" tone="green" />
            <StatusPill text="역할별 가입" tone="slate" />
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
            어떤 역할로
            <br />
            시작하시나요?
          </h1>
        </CareCard>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/login"
            className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)] transition hover:-translate-y-1"
          >
            <div className="text-5xl">👨‍👩‍👧</div>
            <h2 className="mt-5 text-3xl font-black">로그인</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">
              부모님 안심케어를 신청하고, 부모님을 초대하고, 리포트를 확인합니다.
            </p>
            <div className="mt-5 rounded-2xl bg-[#19B99A] px-5 py-4 text-center font-black text-white">
              보호자로 가입
            </div>
          </Link>

          <Link
            href="/signup/manager"
            className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)] transition hover:-translate-y-1"
          >
            <div className="text-5xl">🧑‍⚕️</div>
            <h2 className="mt-5 text-3xl font-black">케어파트너 지원</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">
              부모님 안심케어 현장 업무를 수행할 케어파트너로 지원합니다.
            </p>
            <div className="mt-5 rounded-2xl bg-[#193B38] px-5 py-4 text-center font-black text-white">
              케어파트너 지원
            </div>
          </Link>
        </div>
      </section>
    </AppFrame>
  )
}
