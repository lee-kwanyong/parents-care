import Link from 'next/link'

const steps = [
  {
    title: '안부 신호',
    desc: '부모님이 괜찮아요, 조금 불편해요, 도움이 필요해요 중 하나를 남깁니다.',
    icon: '💬'
  },
  {
    title: '확인 사건',
    desc: '미응답이나 도움 요청이 생기면 보호자가 확인할 일을 만듭니다.',
    icon: '🔔'
  },
  {
    title: '안부완료 리포트',
    desc: '누가 확인했고 어떤 결과였는지 기록으로 남깁니다.',
    icon: '📋'
  }
]

const plans = [
  {
    title: '안부완료 리포트',
    price: '월 9,900원',
    desc: '가족이 직접 확인하고 기록하는 기본 구독',
    href: '/checkout?plan=monthly-report-9900',
    badge: '방문 없음'
  },
  {
    title: '퇴원 후 2주 안부케어',
    price: '299,000원',
    desc: '14일 안부확인 + 생활확인 파트너 3회 포함',
    href: '/checkout?plan=two-week-care-299000',
    badge: '2주 케어'
  }
]

export function PublicServiceIntroPanel() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_58%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[2rem] bg-white/95 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-5 sm:p-8 lg:p-10">
              <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71]">
                확인완료형 안부케어
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                부모님 안부,
                <br />
                확인 완료까지.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-[#637B76] sm:text-lg">
                안부웍스는 부모님의 미응답, 불편, 도움 요청을 확인 사건으로 만들고
                누가 확인했는지 안부완료 리포트로 남깁니다.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/pricing" className="rounded-2xl bg-[#247A71] px-6 py-4 text-center text-sm font-black text-white">
                  요금제 보기
                </Link>

                <Link href="/mobile/parent" className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  부모님 안부 보내기
                </Link>

                <Link href="/child/dashboard" className="rounded-2xl bg-[#FAFFFD] px-6 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  보호자 화면 보기
                </Link>
              </div>
            </div>

            <div className="bg-[#EFFFFA] p-5 sm:p-8 lg:p-10">
              <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#CDEFE7]">
                <div className="text-sm font-black text-[#247A71]">오늘 상태</div>

                <div className="mt-5 space-y-3">
                  {[
                    ['✅', '확인 완료', '오늘 안부가 정상으로 기록되었습니다.'],
                    ['🟡', '확인 필요', '전화 확인 결과를 남겨주세요.'],
                    ['📋', '리포트 생성', '확인 과정과 결과가 정리됩니다.']
                  ].map(([icon, title, desc]) => (
                    <div key={title} className="flex gap-4 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl ring-1 ring-[#D6EDE7]">
                        {icon}
                      </div>
                      <div>
                        <div className="text-lg font-black tracking-[-0.05em]">{title}</div>
                        <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {steps.map((card) => (
            <article key={card.title} className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <div className="text-4xl">{card.icon}</div>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.06em]">{card.title}</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{card.desc}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71]">
            요금제
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <article key={plan.title} className="rounded-[2rem] bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7] sm:p-6">
                <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                  {plan.badge}
                </div>

                <h2 className="mt-4 text-2xl font-black tracking-[-0.06em]">{plan.title}</h2>
                <div className="mt-3 text-4xl font-black tracking-[-0.08em] text-[#17443F]">{plan.price}</div>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{plan.desc}</p>

                <Link href={plan.href} className="mt-5 inline-flex rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  신청하기
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#17443F] p-5 text-white shadow-sm sm:p-8">
          <h2 className="text-3xl font-black leading-tight tracking-[-0.06em] sm:text-4xl">
            알림이 아니라, 확인완료를 남깁니다.
          </h2>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#CDEFE7]">
            본 서비스는 의료 진단이나 응급구조를 대체하지 않는 비의료 안부확인·기록 서비스입니다.
          </p>
        </section>
      </section>
    </main>
  )
}
