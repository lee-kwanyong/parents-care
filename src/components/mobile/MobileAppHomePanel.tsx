import Link from 'next/link'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'

const roles = [
  {
    href: '/mobile/parent',
    badge: '부모님',
    title: '부모님 신호 보내기',
    desc: '괜찮아요, 밥을 못 먹었어요, 약을 못 먹었어요, 몸이 아파요, 지금 도움이 필요해요.',
    cta: '신호 보내기'
  },
  {
    href: '/mobile/guardian',
    badge: '보호자',
    title: '자녀·보호자 앱',
    desc: '부모님 상태, 후속조치, 가족 실행 보드, 알림 기록을 확인합니다.',
    cta: '보호자 화면'
  },
  {
    href: '/mobile/provider',
    badge: '도움망',
    title: '요양보호사·돌봄파트너 앱',
    desc: '긴급 요청함에서 수락하고 확인 완료를 처리합니다.',
    cta: '요청함 열기'
  }
]

export function MobileAppHomePanel() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F]">
      <section className="mx-auto max-w-md space-y-4">
        <header className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7]">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-xs font-black text-[#2AA897]">
            안부웍스 앱
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em]">
            부모님의 작은 신호를
            <br />
            가까운 도움으로 연결합니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            안부웍스는 119를 대체하지 않습니다. 응급상황은 즉시 119 또는 의료기관에 연락해야 합니다.
          </p>

          <div className="mt-5">
            <InstallPrompt />
          </div>
        </header>

        <section className="space-y-3">
          {roles.map((role) => (
            <Link
              key={role.href}
              href={role.href}
              className="block rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="inline-flex rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#2AA897]">
                {role.badge}
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.06em]">{role.title}</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{role.desc}</p>
              <div className="mt-4 rounded-2xl bg-[#247A71] px-4 py-3 text-center text-sm font-black text-white">
                {role.cta}
              </div>
            </Link>
          ))}
        </section>

        <nav className="grid grid-cols-3 gap-2 rounded-[2rem] bg-white/95 p-2 shadow-sm ring-1 ring-[#D6EDE7]">
          <Link href="/proposal" className="rounded-2xl px-3 py-3 text-center text-xs font-black text-[#247A71]">소개</Link>
          <Link href="/response/about" className="rounded-2xl px-3 py-3 text-center text-xs font-black text-[#247A71]">안심망</Link>
          <Link href="/admin/ops/login" className="rounded-2xl px-3 py-3 text-center text-xs font-black text-[#247A71]">운영실</Link>
        </nav>
      </section>
    </main>
  )
}

export default MobileAppHomePanel
