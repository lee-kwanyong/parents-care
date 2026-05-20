import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const apps = [
  {
    href: '/parent/today',
    emoji: '👵',
    title: '부모님 안심',
    desc: '큰 글씨와 큰 버튼으로 오늘 안심 확인, 자녀 전화, 긴급 도움 요청을 합니다.',
    button: '부모님 안심 열기'
  },
  {
    href: '/care-request',
    emoji: '👨‍👩‍👧',
    title: '보호자 케어',
    desc: '부모님 안심케어를 신청하고 보호자 리포트를 확인합니다.',
    button: '보호자 케어 열기'
  },
  {
    href: '/manager',
    emoji: '🧑‍⚕️',
    title: '케어파트너',
    desc: '제안 확인, 수락/거절, 현장 시작/완료, 정산 예정까지 관리합니다.',
    button: '케어파트너 열기'
  }
]

export default function LoginPage() {
  return (
    <AppFrame title="앱 선택" subtitle="접속코드 없이 필요한 화면으로 바로 들어갑니다">
      <section className="mx-auto max-w-5xl">
        <CareCard tone="green">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="모바일 앱" tone="green" />
            <StatusPill text="접속코드 없음" tone="slate" />
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
            어떤 화면으로
            <br />
            들어가시나요?
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69] md:text-lg">
            부모님, 보호자, 케어파트너가 각자 필요한 화면으로 바로 들어갑니다.
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
              <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#24423F]">
                {app.title}
              </h2>
              <p className="mt-3 min-h-24 text-sm font-bold leading-6 text-[#607D79]">
                {app.desc}
              </p>
              <div className="mt-5 rounded-2xl bg-[#19B99A] px-5 py-4 text-center text-base font-black text-white">
                {app.button}
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Link
            href="/app"
            className="rounded-[1.5rem] bg-[#F0FBF7] p-5 text-center font-black text-[#2F756B] ring-1 ring-[#D3ECE6]"
          >
            앱 선택 홈
          </Link>
          <Link
            href="/child/reports"
            className="rounded-[1.5rem] bg-[#F1FAFE] p-5 text-center font-black text-[#365E78] ring-1 ring-[#DDEDF5]"
          >
            보호자 리포트
          </Link>
          <Link
            href="/install"
            className="rounded-[1.5rem] bg-[#FFF9EF] p-5 text-center font-black text-[#7A673C] ring-1 ring-[#F0E0C4]"
          >
            홈 화면 추가
          </Link>
        </section>
      </section>
    </AppFrame>
  )
}
