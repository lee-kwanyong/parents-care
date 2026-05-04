import Link from 'next/link'
import { OpsCommandCenterBoard } from '@/components/OpsCommandCenterBoard'

const opsMenus = [
  ['/ops/families', '가족 공동조회'],
  ['/ops/cases', '통합 케어 케이스'],
  ['/ops/worry-center', '걱정센터'],
  ['/ops/intake-inbox', '사진·카톡 접수함'],
  ['/ops/plan-builder', '케어플랜'],
  ['/ops/manager-field', '매니저 현장'],
  ['/ops/tasks', '가족 할 일'],
  ['/ops/costs', '비용 승인'],
  ['/ops/contact-center', '연락센터'],
  ['/ops/meals', '안심밥상'],
  ['/ops/discharge', '퇴원 후 7일'],
  ['/ops/documents', '서류·영수증'],
  ['/ops/routines', '정기진료'],
  ['/ops/social-care', '사회공헌']
]

export default function OpsHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-sm md:p-10">
          <p className="text-sm font-black text-emerald-200">운영실</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
            오늘 무엇을
            <br />
            먼저 처리해야 할까요?
          </h1>
          <p className="mt-5 max-w-3xl text-xl leading-9 text-slate-200">
            기능 메뉴를 찾기 전에 긴급, 확인 필요, 진행 중, 완료 상태를 먼저 봅니다.
          </p>
        </div>

        <div className="mt-8">
          <OpsCommandCenterBoard />
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">운영 메뉴</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {opsMenus.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-2xl bg-slate-100 px-4 py-3 font-black hover:bg-emerald-50">
                {label}
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
