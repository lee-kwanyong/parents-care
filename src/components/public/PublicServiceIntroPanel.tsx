import Link from 'next/link'

const signalCards = [
  {
    title: '몸 상태 확인',
    desc: '부모님이 몸이 아프거나 불편하다고 느낄 때 보호자에게 바로 알려 확인합니다.',
    badge: '몸 상태',
    icon: '🤒'
  },
  {
    title: '도움 요청',
    desc: '지금 도움이 필요하다는 신호를 운영실 기록과 보호자 알림으로 연결합니다.',
    badge: '도움 요청',
    icon: '🆘'
  },
  {
    title: '안심 리포트',
    desc: '안부 신호, 문자 기록, 미응답, 대리입력, 다음 할 일을 보호자가 한 화면에서 봅니다.',
    badge: '리포트',
    icon: '📋'
  }
]

const actionCards = [
  {
    step: '1',
    title: '부모님이 신호를 보냅니다',
    desc: '괜찮아요, 밥을 못 먹었어요, 약을 못 먹었어요, 몸이 아파요, 지금 도움이 필요해요 중 하나를 누릅니다.'
  },
  {
    step: '2',
    title: '보호자가 바로 확인합니다',
    desc: '문자 알림과 오늘 리포트에서 부모님 상태와 다음 할 일을 확인합니다.'
  },
  {
    step: '3',
    title: '필요하면 사람이 연결됩니다',
    desc: '방문안부, 병원동행, 생활확인 파트너, 운영실 대리입력으로 후속조치를 남깁니다.'
  }
]

const proofCards = [
  {
    title: '지금 가능한 것',
    desc: '부모님 5버튼 앱, 보호자 오늘 리포트, 상황별 문자, 미응답 처리, 대리입력, 운영실 관제'
  },
  {
    title: '실증으로 확인하는 것',
    desc: '가입→부모님 연결→안부 신호→문자→리포트 조회→미응답 후속조치 전환율'
  },
  {
    title: '다음 확장 방향',
    desc: '방문확인, 병원동행, 생활확인 파트너 네트워크, 지자체 B2G 실증, IoT 센서 연동'
  }
]

export function PublicServiceIntroPanel() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[2rem] bg-white/95 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-5 sm:p-8 lg:p-10">
              <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
                안부웍스 · 부모님 안심관리
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                부모님의 몸 상태와
                <br />
                도움 요청을
                <br />
                놓치지 않도록.
              </h1>

              <p className="mt-5 max-w-3xl text-base font-bold leading-8 text-[#637B76] sm:text-lg">
                안부웍스는 고령 부모님의 안부 신호를 보호자 알림, 방문확인, 병원동행, 생활확인 파트너 연결, 안심 리포트로 이어주는 비의료 생활확인 플랫폼입니다.
              </p>

              <div className="mt-6 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
                본 서비스는 119, 의료기관, 의료진의 진단·치료·응급 구조를 대체하지 않습니다. 낙상, 의식저하, 호흡곤란, 심한 통증 등 응급상황은 즉시 119 또는 의료기관에 연락해야 합니다.
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/mobile/parent" className="rounded-2xl bg-[#247A71] px-6 py-4 text-center text-sm font-black text-white">
                  부모님 안부 보내기
                </Link>

                <Link href="/guardian/today" className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  보호자 리포트 보기
                </Link>

                <Link href="/onboarding" className="rounded-2xl bg-[#FAFFFD] px-6 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  가입 후 시작하기
                </Link>
              </div>
            </div>

            <div className="bg-[#EFFFFA] p-5 sm:p-8 lg:p-10">
              <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#CDEFE7]">
                <div className="text-sm font-black text-[#2AA897]">오늘 부모님 상태</div>

                <div className="mt-5 grid gap-3">
                  {[
                    ['✅', '괜찮아요', '오늘 안부가 정상으로 기록되었습니다.'],
                    ['🤒', '몸이 아파요', '보호자 전화 확인이 필요합니다.'],
                    ['🆘', '도움 필요', '운영실 기록과 후속조치가 필요합니다.']
                  ].map(([icon, title, desc]) => (
                    <div key={title} className="flex gap-4 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-[#D6EDE7]">
                        {icon}
                      </div>
                      <div>
                        <div className="text-lg font-black tracking-[-0.05em]">{title}</div>
                        <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-[#247A71] p-4 text-white">
                  <div className="text-sm font-black opacity-80">다음 할 일</div>
                  <p className="mt-2 text-base font-black leading-7">
                    보호자가 먼저 전화 확인하고, 필요하면 방문안부 또는 병원동행 상담으로 연결합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {signalCards.map((card) => (
            <article key={card.title} className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFFFFA] text-3xl ring-1 ring-[#CDEFE7]">
                  {card.icon}
                </div>
                <span className="rounded-full bg-[#FAFFFD] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                  {card.badge}
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-[-0.06em]">{card.title}</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{card.desc}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            보호자 안심 흐름
          </div>

          <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em]">
            버튼 하나가 실제 확인과 기록으로 이어집니다.
          </h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {actionCards.map((card) => (
              <article key={card.step} className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#247A71] text-lg font-black text-white">
                  {card.step}
                </div>
                <h3 className="mt-4 text-2xl font-black tracking-[-0.06em]">{card.title}</h3>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{card.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
              유저스푼 실증 반영
            </div>

            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em]">
              단순 체크보다
              <br />
              몸 상태·방문확인·병원동행이 중요했습니다.
            </h2>

            <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
              초기 사용 경험 조사에서는 식사·복약 체크보다 부모님의 몸 상태, 응급 여부, 병원동행, 방문안부 확인, 보호자 안심 리포트에 대한 필요가 더 크게 나타났습니다. 그래서 안부웍스는 단순 체크 앱이 아니라 후속조치와 리포트 중심으로 제품 방향을 정리합니다.
            </p>
          </section>

          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
              현재와 미래 구분
            </div>

            <div className="mt-5 grid gap-3">
              {proofCards.map((card) => (
                <div key={card.title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-lg font-black">{card.title}</div>
                  <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{card.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] bg-[#17443F] p-5 text-white shadow-sm sm:p-8">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black text-[#BFF5EA]">
            안부웍스 한 문장
          </div>

          <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.06em] sm:text-4xl">
            안부웍스는 부모님의 안부 신호를 보호자 알림, 미응답 확인, 대리입력, 생활확인 파트너 연결, 리포트로 전환하는 비의료 생활확인 기반의 고령자 안심관리 플랫폼입니다.
          </h2>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/admin/ops/pilot-report" className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-[#17443F]">
              실증 리포트 보기
            </Link>

            <Link href="/response/about" className="rounded-2xl bg-white/10 px-6 py-4 text-center text-sm font-black text-white ring-1 ring-white/20">
              서비스 소개 보기
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}

export default PublicServiceIntroPanel
