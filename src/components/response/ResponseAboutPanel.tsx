import Link from 'next/link'

const flows = [
  {
    signal: '도움이 필요해요',
    action: '가족에게 즉시 알리고, 필요하면 가까운 돌봄파트너·수행기관 확인으로 연결합니다.',
    tone: '긴급'
  },
  {
    signal: '밥을 못 먹었어요',
    action: '가족이 확인하고, 필요하면 지역상점·도시락·반찬가게 식사 연결을 검토합니다.',
    tone: '식사'
  },
  {
    signal: '약을 못 먹었어요',
    action: '복약 여부를 다시 확인하고, 반복되면 보호자·돌봄파트너·약국 상담으로 연결합니다.',
    tone: '복약'
  },
  {
    signal: '몸이 아파요',
    action: '가족 또는 돌봄파트너가 전화·방문 확인을 진행하고, 응급 가능성이 있으면 119 또는 의료기관 연락을 안내합니다.',
    tone: '건강'
  }
]

export function ResponseAboutPanel() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-[#123F38] p-5 text-white shadow-[0_18px_52px_rgba(20,82,70,0.16)] sm:rounded-[2.5rem] sm:p-8">
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
            <Link href="/parent/login" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36]">
              부모님 코드 입력
            </Link>
            <Link href="/login" className="rounded-2xl bg-[#20BFA7] px-5 py-4 text-center text-sm font-black text-white">
              보호자 로그인
            </Link>
            <Link href="/response" className="rounded-2xl bg-white/10 px-5 py-4 text-center text-sm font-black text-white ring-1 ring-white/20">
              보호자 후속조치 조회
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {flows.map((item) => (
            <article key={item.signal} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-xs font-black text-[#11977F]">
                {item.tone}
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.06em]">{item.signal}</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                {item.action}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">역할별 화면</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <RoleCard title="부모님" desc="큰 버튼으로 식사·복약·몸 상태·도움 요청을 누릅니다." />
            <RoleCard title="가족" desc="내 부모님의 후속조치만 확인하고 처리 완료를 남깁니다." />
            <RoleCard title="지역 도움망" desc="요청을 수락하고 전화·방문·식사 연결 등 가능한 행동을 합니다." />
            <RoleCard title="지자체·수행기관" desc="전체 위험 요청, 미처리 요청, 사례관리, 성과보고를 확인합니다." />
          </div>
        </section>
      </section>
    </main>
  )
}

function RoleCard({ title, desc }: { title: string; desc: string }) {
  return (
    <article className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
      <h3 className="text-xl font-black tracking-[-0.05em]">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
    </article>
  )
}

export default ResponseAboutPanel
