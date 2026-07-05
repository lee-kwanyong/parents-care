import { AnbuSupportCenter } from '@/components/support/AnbuSupportCenter'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '고객센터 | 안부웍스',
  description: '안부웍스 요금제, 이용 방법, 2주 케어, 안부완료 리포트 문의를 확인하세요.'
}

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_58%,#F6FBFF_100%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-9">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
            고객센터
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
            궁금한 점을
            <br />
            바로 확인하세요.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            안부웍스 이용 방법, 요금제, 2주 안부케어, 추천인 포인트, 결제 문의를 빠르게 안내합니다.
          </p>
        </section>

        <AnbuSupportCenter mode="page" />
      </section>
    </main>
  )
}
