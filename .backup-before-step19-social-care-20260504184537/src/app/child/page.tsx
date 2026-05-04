import Link from 'next/link'

const actions = [
  {
    href: '/child/meals',
    title: '안심밥상·식사 확인',
    desc: '식사 확인, 정기배송, 회복식, 저염식'
  },
  {
    href: '/child/discharge',
    title: '퇴원 후 7일 안심',
    desc: '약, 식사, 통증, 다음 외래, 낙상 확인'
  },
  {
    href: '/child/routines',
    title: '정기진료·다음 예약',
    desc: '다음 예약 후보와 정기 케어 확인'
  },
  {
    href: '/child/documents',
    title: '보험서류·영수증',
    desc: '영수증, 세부내역서, 처방전, 통원확인서'
  },
  {
    href: '/child/tasks',
    title: '가족 할 일',
    desc: '제가 할게요 / 완료했어요 / 다른 가족에게 넘기기'
  },
  {
    href: '/care-request',
    title: '부모님 걱정 맡기기',
    desc: '병원, 식사, 약, 서류, 퇴원 후 케어'
  },
  {
    href: '/care-passport',
    title: '부모님 상태 등록',
    desc: '청력, 통증, 알러지, 복용약'
  },
  {
    href: '/care-packs',
    title: '케어팩 보기',
    desc: '안심밥상, 약 챙김, 퇴원 7일'
  },
  {
    href: '/parent/today',
    title: '부모님 화면 보기',
    desc: '큰 글씨와 큰 버튼'
  }
]

export default function ChildHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-900">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-black text-emerald-700">자녀앱</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            엄마, 오늘 괜찮으세요?
          </h1>

          <div className="mt-6 rounded-3xl bg-amber-50 p-6">
            <p className="text-sm font-black text-amber-700">오늘의 안심판</p>
            <div className="mt-2 text-4xl font-black text-amber-950">확인 필요</div>
            <p className="mt-4 text-lg leading-8 text-amber-950">
              저녁 약 복용 확인과 부모님 상태 등록이 필요합니다.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 font-bold">식사: 점심 확인 필요</div>
              <div className="rounded-2xl bg-white p-4 font-bold">약: 저녁 약 미확인</div>
              <div className="rounded-2xl bg-white p-4 font-bold">다음 할 일: 케어패스포트</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {actions.map((action) => (
              <Link key={action.href} href={action.href} className="rounded-3xl bg-slate-50 p-5 transition hover:bg-emerald-50">
                <h2 className="text-2xl font-black">{action.title}</h2>
                <p className="mt-2 text-slate-600">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-900 p-6 text-white">
          <h2 className="text-2xl font-black">40대 이상 보호자 기준</h2>
          <p className="mt-3 text-lg leading-8 text-slate-200">
            자녀앱은 메뉴를 많이 보여주지 않습니다. 상태는 안심/확인 필요/긴급으로 먼저 보여주고,
            가족이 해야 할 일은 3개 이하로 줄입니다.
          </p>
        </div>
      </section>
    </main>
  )
}
