import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const apps = [
  {
    href: '/parent/today',
    emoji: '👵',
    title: '부모님 안심',
    subtitle: '큰 글씨 · 큰 버튼',
    desc: '오늘 안심 확인, 자녀 전화, 긴급 도움 요청, 방문 케어파트너 확인만 간단히 봅니다.',
    cta: '부모님 안심 열기'
  },
  {
    href: '/care-request',
    emoji: '👨‍👩‍👧',
    title: '보호자 케어',
    subtitle: '신청 · 확인 · 리포트',
    desc: '부모님 안심케어를 신청하고, 운영실 진행상황과 보호자 리포트를 확인합니다.',
    cta: '보호자 케어 열기'
  },
  {
    href: '/manager',
    emoji: '🧑‍⚕️',
    title: '케어파트너',
    subtitle: '제안 · 배정 · 완료',
    desc: '새 제안을 확인하고, 수락/거절, 현장 시작, 완료, 정산 예정까지 관리합니다.',
    cta: '케어파트너 열기'
  }
]

export default function AppSelectPage() {
  return (
    <AppFrame
      title="앱 선택"
      subtitle="접속코드 없이 부모님·보호자·케어파트너 화면으로 바로 들어갑니다"
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
            부모님 안심케어는 하나의 앱 안에서 부모님, 보호자, 케어파트너가 각자 다른 화면을 사용합니다.
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
            href="/child/reports"
            className="rounded-[1.5rem] bg-[#F1FAFE] p-5 text-center font-black text-[#365E78] ring-1 ring-[#DDEDF5]"
          >
            보호자 리포트 보기
          </Link>
          <Link
            href="/manager"
            className="rounded-[1.5rem] bg-[#F0FBF7] p-5 text-center font-black text-[#2F756B] ring-1 ring-[#D3ECE6]"
          >
            케어파트너 화면
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
