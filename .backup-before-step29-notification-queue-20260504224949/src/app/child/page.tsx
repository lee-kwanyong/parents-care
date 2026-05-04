import Link from 'next/link'
import { TodayReassuranceBoard } from '@/components/TodayReassuranceBoard'

const primaryActions = [
  {
    href: '/child/family',
    title: '가족 공동조회',
    desc: '초대 코드로 형제자매와 함께 확인'
  },
  {
    href: '/care-intake',
    title: '사진·카톡으로 맡기기',
    desc: '예약 문자, 약 봉투, 영수증, 카톡 캡처'
  },
  {
    href: '/care-request',
    title: '부모님 걱정 맡기기',
    desc: '병원, 밥, 약, 서류, 퇴원 후 케어'
  },
  {
    href: '/child/tasks',
    title: '가족 할 일',
    desc: '제가 할게요 / 완료했어요'
  },
  {
    href: '/child/cases',
    title: '부모님 케이스',
    desc: '진행상황을 하나로 확인'
  }
]

const secondaryLinks = [
  ['/child/files', '파일함'],
  ['/care-passport', '케어패스포트'],
  ['/child/meals', '안심밥상'],
  ['/child/discharge', '퇴원 후 7일'],
  ['/child/documents', '서류'],
  ['/child/routines', '정기진료'],
  ['/child/costs', '비용 승인'],
  ['/child/summaries', '30초 요약'],
  ['/child/social-care', '사회공헌']
]

export default function ChildHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-black text-emerald-700">자녀앱</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
            엄마,
            <br />
            오늘 괜찮으세요?
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            기능을 찾지 않아도 됩니다. 오늘 부모님 상태와 가족이 할 일만 먼저 확인하세요.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {primaryActions.map((action) => (
              <Link key={action.href} href={action.href} className="rounded-3xl bg-slate-50 p-5 transition hover:bg-emerald-50">
                <h2 className="text-xl font-black">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <TodayReassuranceBoard mode="family" />
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">필요할 때 보는 메뉴</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {secondaryLinks.map(([href, label]) => (
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
