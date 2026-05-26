import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const loginOptions = [
  {
    href: '/signup/guardian',
    emoji: '👨‍👩‍👧',
    title: '보호자 회원가입',
    desc: '부모님 안심케어를 신청하고 리포트를 확인합니다.'
  },
  {
    href: '/parent/login',
    emoji: '👵',
    title: '부모님 6자리 접속',
    desc: '자녀가 알려준 6자리 코드로 부모님 안심 화면에 들어갑니다.'
  },
  {
    href: '/signup/manager',
    emoji: '🧑‍⚕️',
    title: '케어파트너 지원',
    desc: '검증 후 부모님 안심케어 매칭 후보로 등록됩니다.'
  },
  {
    href: '/admin',
    emoji: '🧭',
    title: '운영실 Admin',
    desc: '접수, 매칭, 매니저 검증을 관리하는 관리자 화면입니다.'
  }
]

export default function LoginPage() {
  return (
    <AppFrame title="로그인·회원가입" subtitle="역할에 맞는 화면으로 시작하세요">
      <section className="mx-auto max-w-5xl">
        <CareCard tone="green">
          <div className="flex flex-wrap gap-2">
            <StatusPill text="시작하기" tone="green" />
            <StatusPill text="역할별 화면" tone="slate" />
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
            어떤 화면으로
            <br />
            들어가시나요?
          </h1>
        </CareCard>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {loginOptions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)] transition hover:-translate-y-1 hover:bg-[#F8FCFB]"
            >
              <div className="text-5xl">{item.emoji}</div>
              <h2 className="mt-5 text-3xl font-black">{item.title}</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppFrame>
  )
}
