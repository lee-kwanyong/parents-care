import Link from 'next/link'
import { TodayReassuranceBoard } from '@/components/TodayReassuranceBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

const primaryActions = [
  {
    href: '/care-intake',
    title: '사진·카톡으로 맡기기',
    desc: '예약 문자, 약 봉투, 영수증을 올리세요',
    emoji: '📷'
  },
  {
    href: '/care-request',
    title: '부모님 걱정 맡기기',
    desc: '잘 몰라도 운영실이 정리합니다',
    emoji: '💬'
  },
  {
    href: '/child/tasks',
    title: '가족 할 일',
    desc: '제가 할게요 / 완료했어요',
    emoji: '✅'
  },
  {
    href: '/child/cases',
    title: '부모님 케이스',
    desc: '진행상황을 하나로 확인',
    emoji: '🧾'
  }
]

const secondaryLinks = [
  ['/child/family', '가족 공동조회'],
  ['/child/notifications', '알림함'],
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
    <AppFrame title="자녀앱" subtitle="오늘 부모님 상태를 먼저 확인하세요">
      <SectionHeader
        eyebrow="자녀앱"
        title={
          <>
            엄마,
            <br />
            오늘 괜찮으세요?
          </>
        }
        description="기능을 찾지 않아도 됩니다. 오늘의 안심판, 가족 할 일, 확인 필요한 이유만 먼저 보세요."
      />

      <div className="mt-8">
        <TodayReassuranceBoard mode="family" />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black">가장 많이 쓰는 버튼</h2>
          <StatusPill text="3번 안에 완료" tone="green" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {primaryActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <CareCard className="h-full transition hover:-translate-y-1 hover:shadow-md">
                <div className="text-4xl">{action.emoji}</div>
                <h3 className="mt-4 text-xl font-black">{action.title}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{action.desc}</p>
              </CareCard>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-2xl font-black">필요할 때 보는 메뉴</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {secondaryLinks.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black hover:bg-emerald-50">
              {label}
            </Link>
          ))}
        </div>
      </section>
    </AppFrame>
  )
}
