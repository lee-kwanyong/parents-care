import Link from 'next/link'

export const metadata = {
  title: '지역 안심망 소개 | 안부웍스',
  description:
    '부모님의 안부 신호를 가족, 돌봄파트너, 지역상점, 약국, 수행기관, 지자체가 처리 가능한 행동으로 연결하는 지역 안심망입니다.'
}

const steps = [
  {
    number: '1',
    title: '부모님이 신호를 보냅니다',
    desc: '식사, 복약, 몸 상태, 도움 요청 같은 생활 신호를 쉽고 빠르게 남깁니다.'
  },
  {
    number: '2',
    title: '가족이 먼저 확인합니다',
    desc: '보호자는 부모님 상태와 지금 해야 할 일을 한눈에 확인합니다.'
  },
  {
    number: '3',
    title: '필요하면 지역 도움망이 연결됩니다',
    desc: '돌봄파트너, 지역상점, 약국, 수행기관, 지자체가 처리 가능한 행동으로 이어집니다.'
  }
]

const actionCards = [
  {
    title: '밥을 못 먹었어요',
    desc: '보호자 확인 후 지역상점, 도시락, 돌봄파트너 연결을 검토합니다.'
  },
  {
    title: '약을 못 먹었어요',
    desc: '복약 여부를 확인하고 보호자 또는 약국 상담으로 연결합니다.'
  },
  {
    title: '몸이 아파요',
    desc: '전화 확인과 방문 확인을 우선하고, 응급 가능성이 있으면 119 또는 의료기관 연락을 안내합니다.'
  },
  {
    title: '지금 도움이 필요해요',
    desc: '보호자 알림과 운영실 확인, 가까운 지역 도움망 요청으로 이어집니다.'
  }
]

export default function ResponseAboutPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_52%,#F6FBFF_100%)] px-4 py-7 text-[#194843] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF7_0%,#D8F6F0_52%,#F4FBFF_100%)] p-5 shadow-[0_18px_54px_rgba(49,151,136,0.12)] ring-1 ring-[#D6EDE7] sm:rounded-[2.7rem] sm:p-8 lg:p-10">
          <div className="inline-flex rounded-full bg-white/55 px-4 py-2 text-sm font-black text-[#267B70] shadow-sm ring-1 ring-[#CDEFE7]">
            안부웍스 지역 안심망
          </div>

          <h1 className="mt-8 max-w-5xl text-4xl font-black leading-tight tracking-[-0.08em] text-[#17443F] sm:text-5xl lg:text-6xl">
            서로가 서로를 보호하고
            <br />
            위험할 때 가까운 사람이 돕습니다.
          </h1>

          <p className="mt-6 max-w-5xl text-base font-extrabold leading-8 text-[#637B76] sm:text-lg">
            부모님의 안부 신호를 가족, 돌봄파트너, 지역상점, 약국, 수행기관, 지자체가 처리 가능한 행동으로 자동 연결하는 플랫폼입니다.
          </p>

          <div className="mt-7 rounded-2xl bg-white/58 px-5 py-4 text-sm font-black leading-7 text-[#315D57] shadow-sm ring-1 ring-[#C8E9E2]">
            본 서비스는 의료 진단이나 응급 구조 서비스를 대체하지 않습니다. 응급상황은 119 또는 의료기관에 연락해야 합니다.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Link
              href="/family-link"
              className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#194843] shadow-sm ring-1 ring-[#CDE9E2] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              부모님 코드 입력
            </Link>

            <Link
              href="/login"
              className="rounded-2xl bg-[#2EC4B6] px-5 py-4 text-center text-sm font-black text-white shadow-[0_12px_26px_rgba(46,196,182,0.26)] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              보호자 시작하기
            </Link>

            <Link
              href="/response"
              className="rounded-2xl bg-white/38 px-5 py-4 text-center text-sm font-black text-[#194843] shadow-sm ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-lg"
            >
              보호자 후속조치 조회
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/92 p-5 shadow-[0_16px_44px_rgba(49,151,136,0.08)] ring-1 ring-[#D7EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            헷갈리지 않는 3단계
          </div>

          <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.06em] text-[#194843] sm:text-4xl">
            버튼 하나가 실제 행동으로 이어집니다.
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-3xl bg-[linear-gradient(180deg,#FBFFFE_0%,#F6FCFA_100%)] p-5 shadow-sm ring-1 ring-[#D6EDE7]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2EC4B6] text-sm font-black text-white shadow-sm">
                  {step.number}
                </div>
                <h3 className="mt-5 text-xl font-black tracking-[-0.05em] text-[#194843]">{step.title}</h3>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/92 p-5 shadow-[0_16px_44px_rgba(49,151,136,0.08)] ring-1 ring-[#D7EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            안부 신호별 후속조치
          </div>

          <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.06em] text-[#194843] sm:text-4xl">
            안부 확인에서 끝나지 않고,
            <br />
            가까운 사람이 움직입니다.
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {actionCards.map((card) => (
              <article
                key={card.title}
                className="rounded-3xl bg-[#FAFFFD] p-5 shadow-sm ring-1 ring-[#D6EDE7]"
              >
                <h3 className="text-xl font-black tracking-[-0.05em] text-[#194843]">{card.title}</h3>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{card.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#F0FFFB] p-5 text-[#194843] shadow-sm ring-1 ring-[#CDEFE7] sm:rounded-[2.5rem] sm:p-8">
          <h2 className="text-3xl font-black tracking-[-0.06em]">운영실과 지자체까지 연결됩니다.</h2>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76]">
            안부웍스는 가족 알림, 지역 도움망 요청, 사건 타임라인, 운영보고서, 개인정보 동의·열람 감사, 지자체 제출 패키지까지 이어지는 돌봄 관제 흐름을 제공합니다.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Link href="/ops/incidents" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#194843] ring-1 ring-[#D6EDE7]">
              사건 타임라인
            </Link>
            <Link href="/ops/network" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#194843] ring-1 ring-[#D6EDE7]">
              도움망 네트워크
            </Link>
            <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#194843] ring-1 ring-[#D6EDE7]">
              운영보고서
            </Link>
            <Link href="/gov/submission-package" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#194843] ring-1 ring-[#D6EDE7]">
              제출 패키지
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}
