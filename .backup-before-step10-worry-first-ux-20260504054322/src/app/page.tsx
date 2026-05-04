import Link from 'next/link'

const mainActions = [
  {
    href: '/care-request',
    title: '부모님 걱정 맡기기',
    desc: '병원, 식사, 약, 서류, 퇴원 후 케어를 쉽게 접수합니다.',
    emoji: '🤝'
  },
  {
    href: '/care-packs',
    title: '케어팩 보기',
    desc: '안심밥상, 약 챙김, 퇴원 후 7일, 정기진료 관리를 한눈에 봅니다.',
    emoji: '📦'
  },
  {
    href: '/ops/plan-builder',
    title: '운영실 플랜 만들기',
    desc: '접수된 걱정을 가족용 간편 케어플랜으로 바꿉니다.',
    emoji: '🧭'
  },
  {
    href: '/parent/today',
    title: '부모님 큰 글씨 화면',
    desc: '부모님은 복잡한 앱 대신 큰 버튼만 사용합니다.',
    emoji: '👵'
  }
]

const principles = [
  '기능을 찾지 않고 걱정을 누른다',
  '질문은 한 번에 3개 이하',
  '전화·카톡·사진 접수를 기본으로 둔다',
  '부모님 화면은 큰 글씨와 큰 버튼',
  '추가비용은 먼저 승인받는다',
  '사회공헌 연결을 제품 안에 둔다'
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10">
          <p className="text-sm font-black text-emerald-700">부모님 케어 플랫폼</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
            부모님 걱정을
            <br />
            쉽게 맡기는 앱
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-600">
            병원동행만 하는 앱이 아니라, 병원 전·중·후와 밥, 약, 서류, 퇴원 후 케어,
            정기진료, 사회공헌 연결까지 운영실이 쉽게 정리해주는 플랫폼입니다.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {mainActions.map((action) => (
              <Link key={action.href} href={action.href} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:bg-emerald-50">
                <div className="text-4xl">{action.emoji}</div>
                <h2 className="mt-4 text-2xl font-black">{action.title}</h2>
                <p className="mt-2 text-base leading-7 text-slate-600">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-900 p-6 text-white md:col-span-2">
            <h2 className="text-2xl font-black">40대 이상 보호자용 원칙</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {principles.map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 p-4 font-bold">
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-emerald-50 p-6">
            <h2 className="text-2xl font-black text-emerald-950">오늘 기준</h2>
            <p className="mt-3 text-lg leading-8 text-emerald-950">
              로그인 연동은 배포 직전에 하고, 지금은 비로그인 걱정 접수와 운영실 케어플랜 생성을 먼저 완성합니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
