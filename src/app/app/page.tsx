import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const apps = [
  {
    href: '/parent/login',
    emoji: '👵',
    title: '부모님 안심',
    subtitle: '4자리 코드 · 큰 버튼',
    desc: '회원가입 없이 자녀가 알려준 4자리 코드로 오늘 안심 확인 화면에 들어갑니다.',
    cta: '부모님 안심 열기'
  },
  {
    href: '/signup/guardian',
    emoji: '👨‍👩‍👧',
    title: '보호자 케어',
    subtitle: '가입 · 초대 · 리포트',
    desc: '보호자가 가입하고 부모님께 4자리 코드를 보내 안심케어를 시작합니다.',
    cta: '보호자 케어 시작'
  },
  {
    href: '/signup/manager',
    emoji: '🧑‍⚕️',
    title: '케어파트너',
    subtitle: '지원 · 검증 · 배정',
    desc: '부모님 안심케어 현장 업무를 수행할 케어파트너로 지원합니다.',
    cta: '케어파트너 지원'
  }
]

export default function AppSelectPage() {
  return (
    <AppFrame
      title="앱 선택"
      subtitle="부모님·보호자·케어파트너가 각자 필요한 화면으로 들어갑니다"
    >
      <section className="mx-auto max-w-5xl">
        <CareCard tone="green">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="모바일 앱" tone="green" />
            <StatusPill text="3가지 사용자 모드" tone="slate" />
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
            누가 사용하시나요?
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69] md:text-lg">
            부모님은 회원가입 없이 4자리 코드로, 보호자는 회원가입 후 초대코드로, 케어파트너는 별도 지원으로 시작합니다.
          </p>
        </CareCard>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="block rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)] transition hover:-translate-y-1 hover:bg-[#F8FCFB]"
            >
              <div className="text-5xl">{app.emoji}</div>
              <div className="mt-5 inline-flex rounded-full bg-[#F2FAF8] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#DDEEEA]">
                {app.subtitle}
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#24423F]">
                {app.title}
              </h2>
              <p className="mt-3 min-h-24 text-sm font-bold leading-6 text-[#607D79]">
                {app.desc}
              </p>
              <div className="mt-5 rounded-2xl bg-[#19B99A] px-5 py-4 text-center text-base font-black text-white">
                {app.cta}
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Link
            href="/parent/login"
            className="rounded-[1.5rem] bg-[#F0FBF7] p-5 text-center font-black text-[#2F756B] ring-1 ring-[#D3ECE6]"
          >
            부모님 4자리 접속
          </Link>
          <Link
            href="/child/reports"
            className="rounded-[1.5rem] bg-[#F1FAFE] p-5 text-center font-black text-[#365E78] ring-1 ring-[#DDEDF5]"
          >
            보호자 리포트 보기
          </Link>
          <Link
            href="/install"
            className="rounded-[1.5rem] bg-[#FFF9EF] p-5 text-center font-black text-[#7A673C] ring-1 ring-[#F0E0C4]"
          >
            홈 화면에 추가하기
          </Link>
        </section>
      </section>
    </AppFrame>
  )
}
