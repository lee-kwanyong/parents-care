import Link from 'next/link'
import { allCarePacks } from '@/lib/care-plan-engine'

export default function CarePacksPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">케어팩</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          기능을 하나씩 찾지 말고
          <br />
          필요한 케어를 묶음으로 선택합니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#63807C]">
          40대 이상 보호자가 쉽게 이해할 수 있도록 병원, 식사, 약, 서류, 퇴원, 정기케어를 묶음으로 설계했습니다.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {allCarePacks.map((pack) => (
            <article key={pack.code} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="text-xs font-black text-emerald-700">{pack.code}</div>
              <h2 className="mt-2 text-2xl font-black">{pack.title}</h2>
              <p className="mt-3 text-base leading-7 text-[#63807C]">{pack.target}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pack.includes.map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-[#4E6D69]">
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/care-request" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
            부모님 안심케어 신청하기
          </Link>
          <Link href="/admin/ops/plan-builder" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
            운영실 플랜 만들기
          </Link>
          <Link href="/" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
            홈으로
          </Link>
        </div>
      </section>
    </main>
  )
}
