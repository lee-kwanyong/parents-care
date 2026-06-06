import Link from 'next/link'

const signalCards = [
  {
    label: '도움이 필요해요',
    level: '긴급',
    desc: '가족에게 즉시 알리고, 필요하면 가까운 돌봄파트너·수행기관 확인으로 연결합니다.',
    color: 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  },
  {
    label: '밥을 못 먹었어요',
    level: '식사',
    desc: '가족이 먼저 확인하고, 필요하면 지역상점·도시락·반찬가게 식사 연결을 검토합니다.',
    color: 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  },
  {
    label: '약을 못 먹었어요',
    level: '복약',
    desc: '복약 여부를 다시 확인하고, 반복되면 보호자·돌봄파트너·약국 상담으로 연결합니다.',
    color: 'bg-[#F3F8FF] text-[#255B83] ring-[#D8EAFB]'
  },
  {
    label: '몸이 아파요',
    level: '건강',
    desc: '가족 또는 돌봄파트너가 상태를 확인하고, 응급 가능성이 있으면 119 또는 의료기관 연락을 안내합니다.',
    color: 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  }
]

const steps = [
  {
    title: '부모님이 신호를 보냅니다',
    desc: '식사·복약·몸 상태·도움 요청을 큰 버튼으로 선택합니다.'
  },
  {
    title: '가족이 먼저 확인합니다',
    desc: '보호자는 내 부모님 신호만 보고 전화 확인 또는 처리 완료를 남깁니다.'
  },
  {
    title: '필요하면 지역 도움망이 연결됩니다',
    desc: '돌봄파트너, 지역상점, 약국, 수행기관, 지자체가 각자 가능한 행동으로 이어집니다.'
  }
]

const roles = [
  {
    title: '부모님',
    desc: '어려운 앱 사용 없이 큰 버튼으로 안부 신호를 보냅니다.'
  },
  {
    title: '가족',
    desc: '내 부모님 요청만 확인하고, 누가 확인할지와 처리 결과를 남깁니다.'
  },
  {
    title: '지역 도움망',
    desc: '요양보호사, 돌봄파트너, 가게, 약국이 가능한 도움을 수락합니다.'
  },
  {
    title: '지자체·수행기관',
    desc: '전체 위험 요청과 미처리 요청을 관제하고 사례관리로 기록합니다.'
  }
]

export function ResponseAboutPanel() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-[#247A71] p-5 text-white shadow-[0_18px_52px_rgba(20,82,70,0.16)] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black text-[#A7F2E3] ring-1 ring-white/20">
            안부웍스 지역 안심망
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-6xl">
            서로가 서로를 보호하고
            <br />
            위험할 때 가까운 사람이 돕습니다.
          </h1>

          <p className="mt-5 max-w-4xl text-base font-bold leading-8 text-[#E7FFF7] sm:text-xl">
            부모님의 안부 신호를 가족, 돌봄파트너, 지역상점, 약국, 수행기관, 지자체가 처리 가능한 행동으로 자동 연결하는 플랫폼입니다.
          </p>

          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm font-black leading-7 text-[#F8FFFC] ring-1 ring-white/20">
            본 서비스는 의료 진단이나 응급 구조 서비스를 대체하지 않습니다. 응급상황은 119 또는 의료기관에 연락해야 합니다.
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href="/parent/login" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F]">
              부모님 코드 입력
            </Link>
            <Link href="/login" className="rounded-2xl bg-[#20BFA7] px-5 py-4 text-center text-sm font-black text-white">
              보호자 시작하기
            </Link>
            <Link href="/response" className="rounded-2xl bg-white/10 px-5 py-4 text-center text-sm font-black text-white ring-1 ring-white/20">
              보호자 후속조치 조회
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            헷갈리지 않는 3단계
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.06em] sm:text-4xl">
            버튼 하나가 실제 행동으로 이어집니다.
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#247A71] text-sm font-black text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-xl font-black tracking-[-0.05em]">{step.title}</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {signalCards.map((item) => (
            <article key={item.label} className={'rounded-[2rem] p-5 shadow-sm ring-1 sm:p-6 ' + item.color}>
              <div className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                {item.level}
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.06em]">{item.label}</h2>
              <p className="mt-3 text-sm font-bold leading-7 opacity-85">{item.desc}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">역할별로 보는 화면이 다릅니다.</h2>
          <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
            일반 사용자는 소개를 보고, 보호자는 내 부모님 요청만 보고, 운영실과 지자체는 인증 후 전체 요청을 관제합니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {roles.map((role) => (
              <article key={role.title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <h3 className="text-xl font-black tracking-[-0.05em]">{role.title}</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{role.desc}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default ResponseAboutPanel
