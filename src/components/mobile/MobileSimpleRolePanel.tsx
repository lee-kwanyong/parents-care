import Link from 'next/link'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'

type Action = {
  href: string
  title: string
  desc: string
  primary?: boolean
}

export function MobileSimpleRolePanel({
  badge,
  title,
  desc,
  actions
}: {
  badge: string
  title: string
  desc: string
  actions: Action[]
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F]">
      <section className="mx-auto max-w-md space-y-4">
        <header className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7]">
          <Link href="/mobile" className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-xs font-black text-[#2AA897]">
            ← 안부웍스 앱
          </Link>

          <div className="mt-5 inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-xs font-black text-[#2AA897]">
            {badge}
          </div>

          <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.08em]">{title}</h1>
          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>

          <div className="mt-5">
            <InstallPrompt />
          </div>
        </header>

        <section className="space-y-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                'block rounded-[2rem] p-5 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ' +
                (action.primary
                  ? 'bg-[#247A71] text-white ring-[#247A71]'
                  : 'bg-white/95 text-[#17443F] ring-[#D6EDE7]')
              }
            >
              <h2 className="text-2xl font-black tracking-[-0.06em]">{action.title}</h2>
              <p className={'mt-2 text-sm font-bold leading-7 ' + (action.primary ? 'text-white/80' : 'text-[#637B76]')}>
                {action.desc}
              </p>
            </Link>
          ))}
        </section>

        <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
          안부웍스는 119를 대체하지 않습니다. 응급상황은 즉시 119 또는 의료기관에 연락해야 합니다.
        </section>
      </section>
    </main>
  )
}

export default MobileSimpleRolePanel
