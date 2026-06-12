import Link from 'next/link'

export const metadata = {
  title: '파트너 DB | 부모님 안심케어',
  description: '파트너 정보를 관리합니다.'
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            운영 메뉴
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em]">
            파트너 DB
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            파트너 정보를 관리합니다.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/ops/pilot"
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white"
            >
              실증 운영실
            </Link>

            <Link
              href="/"
              className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              홈으로
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}
