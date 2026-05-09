import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

const worryActions = [
  {
    href: '/login',
    title: '로그인·회원가입',
    desc: '카카오, 휴대폰, 이메일 링크',
    emoji: '🔐'
  },
  {
    href: '/care-intake',
    title: '사진·카톡으로 맡기기',
    desc: '예약 문자, 약 봉투, 영수증, 처방전',
    emoji: '📷'
  },
  {
    href: '/care-request',
    title: '부모님 걱정 맡기기',
    desc: '병원, 밥, 약, 서류, 퇴원 후 케어',
    emoji: '💬'
  },
  {
    href: '/child/today',
    title: '오늘의 안심판',
    desc: '안심 / 확인 필요 / 긴급',
    emoji: '🟢'
  },
  {
    href: '/family-code',
    title: '가족 공동조회',
    desc: '형제자매와 함께 확인',
    emoji: '👨‍👩‍👧‍👦'
  }
]

const worries = [
  '병원에 혼자 못 가세요',
  '밥을 잘 못 챙겨 드세요',
  '약을 잘 드시는지 모르겠어요',
  '퇴원 후 집에서 걱정돼요',
  '보험서류가 필요해요',
  '뭘 해야 할지 모르겠어요'
]

export default function HomePage() {
  return (
    <AppFrame title="부모님 케어 플랫폼" subtitle="부모님 걱정을 간단히 맡기는 앱">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <StatusPill text="40대 이상 보호자용" tone="green" />
          <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-7xl">
            부모님 걱정,
            <br />
            쉽게 맡기세요.
          </h1>
          <p className="mt-6 max-w-2xl text-xl font-bold leading-9 text-slate-600">
            앱이 어려워도 괜찮습니다. 사진, 카톡, 전화, 한 줄 메모로 맡기면 운영실이 병원·식사·약·서류·퇴원 후 케어로 정리합니다.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <CareButton href="/care-intake" size="xl">
              사진·카톡으로 맡기기
            </CareButton>
            <CareButton href="/care-request" tone="dark" size="xl">
              걱정 선택하기
            </CareButton>
          </div>
        </div>

        <CareCard tone="dark" className="lg:mt-8">
          <p className="text-sm font-black text-emerald-200">무엇이 걱정되세요?</p>
          <div className="mt-5 grid gap-3">
            {worries.map((worry) => (
              <Link key={worry} href="/care-request" className="rounded-3xl bg-white/10 p-4 text-lg font-black text-white transition hover:bg-white/15">
                {worry}
              </Link>
            ))}
          </div>
          <p className="mt-5 rounded-3xl bg-emerald-200 p-4 text-sm font-black leading-6 text-slate-950">
            잘 모르겠으면 “뭘 해야 할지 모르겠어요”만 눌러도 됩니다.
          </p>
        </CareCard>
      </section>

      <section className="mt-10">
        <SectionHeader
          eyebrow="빠른 시작"
          title="3번 안에 끝납니다"
          description="복잡한 메뉴 대신 가장 많이 쓰는 행동만 먼저 보여줍니다."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {worryActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <CareCard className="h-full transition hover:-translate-y-1 hover:shadow-md">
                <div className="text-4xl">{action.emoji}</div>
                <h2 className="mt-4 text-2xl font-black">{action.title}</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{action.desc}</p>
              </CareCard>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <CareCard tone="green">
          <h2 className="text-2xl font-black">자녀앱</h2>
          <p className="mt-3 text-sm font-bold leading-6">오늘의 안심판과 가족 할 일 3개만 먼저 확인합니다.</p>
          <CareButton href="/child" className="mt-5" tone="white">
            자녀앱 보기
          </CareButton>
        </CareCard>

        <CareCard tone="blue">
          <h2 className="text-2xl font-black">부모님앱</h2>
          <p className="mt-3 text-sm font-bold leading-6">큰 글씨, 만남 암호, 자녀 전화, 도움 요청만 남깁니다.</p>
          <CareButton href="/parent/today" className="mt-5" tone="white">
            부모님 화면
          </CareButton>
        </CareCard>

        <CareCard tone="amber">
          <h2 className="text-2xl font-black">운영실</h2>
          <p className="mt-3 text-sm font-bold leading-6">긴급, 확인 필요, 진행 중, 완료를 우선순위로 봅니다.</p>
          <CareButton href="/ops" className="mt-5" tone="white">
            운영실 보기
          </CareButton>
        </CareCard>
      </section>
    </AppFrame>
  )
}
