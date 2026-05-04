import Link from 'next/link'

const worries = [
  {
    href: '/care-request',
    emoji: '🏥',
    title: '병원에 혼자 못 가세요',
    desc: '병원 예약, 동행, 접수, 진료 내용, 약국, 서류까지 정리합니다.'
  },
  {
    href: '/care-request',
    emoji: '🍱',
    title: '밥을 잘 못 챙겨 드세요',
    desc: '식사 확인, 안심밥상, 도시락·죽·저염식·회복식 연결을 도와드립니다.'
  },
  {
    href: '/care-request',
    emoji: '💊',
    title: '약을 잘 드시는지 모르겠어요',
    desc: '처방약, 복용 시간, 먹었어요 확인, 가족 알림으로 이어집니다.'
  },
  {
    href: '/care-request',
    emoji: '🏠',
    title: '퇴원 후 집에서 걱정돼요',
    desc: '퇴원 후 7일 동안 약, 식사, 통증, 다음 외래, 귀가 안전을 확인합니다.'
  },
  {
    href: '/care-request',
    emoji: '📄',
    title: '보험서류가 필요해요',
    desc: '영수증, 세부내역서, 통원확인서, 처방전, 검사결과지를 챙깁니다.'
  },
  {
    href: '/care-request',
    emoji: '🤝',
    title: '뭘 해야 할지 모르겠어요',
    desc: '상황만 알려주시면 병원·밥·약·서류·퇴원 케어 중 필요한 도움을 정리합니다.'
  }
]

const simpleActions = [
  {
    href: '/family-code',
    title: '가족 공동조회 코드',
    desc: '형제자매와 함께 확인'
  },
  {
    href: '/child/today',
    title: '오늘의 안심판',
    desc: '안심 / 확인 필요 / 긴급 확인'
  },
  {
    href: '/care-cases',
    title: '부모님 케이스 보기',
    desc: '진행상황을 하나로 확인'
  },
  {
    href: '/care-intake',
    title: '사진·카톡으로 맡기기',
    desc: '예약 문자, 카톡, 약 봉투, 영수증'
  },
  {
    href: '/care-request',
    title: '부모님 걱정 맡기기',
    desc: '가장 먼저 누르는 버튼'
  },
  {
    href: '/care-passport',
    title: '부모님 상태 등록',
    desc: '청력, 통증, 알러지, 복용약'
  },
  {
    href: '/care-packs',
    title: '케어팩 보기',
    desc: '식사·약·퇴원·서류 묶음'
  },
  {
    href: '/parent/today',
    title: '부모님 큰 글씨 화면',
    desc: '부모님용 단순 화면'
  }
]

const channels = [
  '전화로 맡기기',
  '카톡으로 맡기기',
  '사진으로 맡기기',
  '직접 간단 입력'
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10">
          <p className="text-sm font-black text-emerald-700">부모님 케어 플랫폼</p>

          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
                무엇이
                <br />
                걱정되세요?
              </h1>
              <p className="mt-5 max-w-3xl text-xl leading-9 text-slate-600">
                병원동행 신청서를 쓰는 앱이 아닙니다. 부모님 걱정을 누르면,
                운영실이 병원·밥·약·서류·퇴원 후 케어까지 쉬운 플랜으로 정리합니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {channels.map((channel) => (
                  <span key={channel} className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
                    {channel}
                  </span>
                ))}
              </div>
            </div>

            <aside className="rounded-3xl bg-slate-900 p-6 text-white">
              <p className="text-sm font-black text-emerald-200">오늘의 안심판</p>
              <div className="mt-3 text-5xl font-black">확인 필요</div>
              <p className="mt-4 text-lg leading-8 text-slate-200">
                부모님 상태 등록이 아직 부족합니다. 청력, 통증, 알러지, 복용약을 먼저 확인하면 케어 품질이 좋아집니다.
              </p>
              <Link href="/care-passport" className="mt-5 block rounded-2xl bg-white px-5 py-4 text-center text-lg font-black text-slate-950">
                부모님 상태 등록
              </Link>
            </aside>
          </div>
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-black md:text-3xl">걱정을 골라주세요</h2>
          <p className="mt-2 text-slate-600">
            잘 몰라도 괜찮습니다. 가장 비슷한 걱정만 누르면 됩니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {worries.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                <div className="text-4xl">{item.emoji}</div>
                <h3 className="mt-4 text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {simpleActions.map((action) => (
            <Link key={action.href} href={action.href} className="rounded-3xl bg-white p-5 shadow-sm transition hover:bg-emerald-50">
              <h3 className="text-lg font-black">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{action.desc}</p>
            </Link>
          ))}
        </section>

        <section className="mt-6 rounded-3xl bg-slate-900 p-6 text-white">
          <h2 className="text-2xl font-black">우리 앱의 기준</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              '사용자는 기능을 찾지 않고 걱정을 누른다',
              '질문은 한 번에 3개 이하',
              '앱이 어려우면 전화·카톡·사진으로 맡긴다',
              '부모님 화면은 큰 글씨와 큰 버튼',
              '알러지와 복용약은 반드시 확인한다',
              '사회공헌 연결을 제품 안에 둔다'
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 p-4 font-bold">
                ✓ {item}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
