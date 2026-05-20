import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

export default function ManagerSignupPage() {
  return (
    <AppFrame title="케어파트너 지원" subtitle="검증 후 부모님 안심케어 매칭 후보로 등록됩니다">
      <section className="mx-auto max-w-4xl">
        <CareCard tone="green">
          <div className="flex flex-wrap gap-2">
            <StatusPill text="케어파트너" tone="green" />
            <StatusPill text="별도 지원" tone="slate" />
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
            케어파트너로
            <br />
            활동하시겠어요?
          </h1>

          <p className="mt-4 text-base font-bold leading-7 text-[#4E6D69]">
            케어파트너는 보호자와 부모님의 안심케어 요청을 수행합니다. 간단 등록 후 운영실 검증을 거쳐 매칭 후보로 등록됩니다.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Link
              href="/manager/register"
              className="rounded-3xl bg-[#19B99A] px-6 py-5 text-center text-lg font-black text-white"
            >
              케어파트너 지원하기
            </Link>
            <Link
              href="/manager"
              className="rounded-3xl bg-white px-6 py-5 text-center text-lg font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              케어파트너 화면 보기
            </Link>
          </div>
        </CareCard>
      </section>
    </AppFrame>
  )
}
