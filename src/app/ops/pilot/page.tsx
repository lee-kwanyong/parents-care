import Link from 'next/link'

export const metadata = {
  title: '실증 운영실 | 부모님 안심케어',
  description: '실증·응답률·확인율을 관리합니다.'
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            운영 메뉴
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em]">
            실증 운영실
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            실증·응답률·확인율을 관리합니다.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/ops/pilot"
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white"
            >
              실증 운영실
            </Link>

            <Link
              href="/"
              className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              홈으로
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}
