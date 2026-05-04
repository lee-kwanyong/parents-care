import Link from 'next/link'

const opsMenus = [
  {
    href: '/ops/meals',
    title: '안심밥상 운영',
    desc: '식사 확인, 정기배송, 회복식, 사회공헌 식사 연결을 관리합니다.'
  },
  {
    href: '/ops/discharge',
    title: '퇴원 후 7일 운영',
    desc: '약, 식사, 통증, 다음 외래, 낙상 위험을 7일 동안 확인합니다.'
  },
  {
    href: '/ops/routines',
    title: '정기진료 운영',
    desc: '다음 예약 후보, 예약 요청, 예약 완료 상태를 관리합니다.'
  },
  {
    href: '/ops/documents',
    title: '서류·영수증 운영',
    desc: '실손보험, 영수증, 세부내역서, 처방전, 통원확인서를 관리합니다.'
  },
  {
    href: '/ops/tasks',
    title: '가족 할 일 보드',
    desc: '식사·약·서류·예약·사회공헌 할 일을 가족에게 나누고 완료 상태를 확인합니다.'
  },
  {
    href: '/ops/worry-center',
    title: '걱정 요청 목록',
    desc: '보호자가 접수한 병원·식사·약·서류·퇴원 걱정을 확인합니다.'
  },
  {
    href: '/ops/plan-builder',
    title: '케어플랜 생성',
    desc: '걱정을 가족용 간편 케어플랜으로 바꿉니다.'
  },
  {
    href: '/ops/care-passport',
    title: '케어패스포트 확인',
    desc: '청력, 통증, 알러지, 복용약, 낙상 위험을 확인합니다.'
  },
  {
    href: '/ops/assignments',
    title: '매니저 배정',
    desc: '병원동행이 필요한 경우 매니저를 배정합니다.'
  },
  {
    href: '/ops/reports',
    title: '리포트·서류 검수',
    desc: '진료 내용, 약, 서류, 다음 예약을 가족에게 보내기 전에 확인합니다.'
  },
  {
    href: '/ops/risks',
    title: '위험·사회공헌 관리',
    desc: '긴급, 비용 부담, 공공지원, 후원 쿠폰 연결을 관리합니다.'
  }
]

export default function OpsHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-sm md:p-10">
          <p className="text-sm font-black text-emerald-200">운영실</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
            보호자 화면 뒤에서
            <br />
            걱정을 해결합니다.
          </h1>
          <p className="mt-5 max-w-3xl text-xl leading-9 text-slate-200">
            예약 접수, 매니저 배정, 전문가 검증, 리포트 작성은 보호자 첫 화면이 아니라
            운영실에서 처리하는 기능입니다.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {opsMenus.map((menu) => (
            <Link key={menu.href} href={menu.href} className="rounded-3xl bg-white p-6 shadow-sm transition hover:bg-emerald-50">
              <h2 className="text-2xl font-black">{menu.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{menu.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">운영실 원칙</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              '보호자에게 질문은 3개 이하로 보낸다',
              '알러지와 복용약은 플랜 전 반드시 확인한다',
              '차량 보유와 직접 운송 가능 여부는 분리한다',
              '추가 비용은 보호자 승인 후 진행한다',
              '비용 부담이 있으면 공공지원·후원 연결을 검토한다',
              '부모님에게는 관리가 아니라 도움으로 표현한다'
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4 font-bold">
                ✓ {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
