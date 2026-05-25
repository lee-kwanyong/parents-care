import Link from 'next/link'
import type { ReactNode } from 'react'
import { MobileQuickNav } from './MobileQuickNav'
import { DemoRoleBanner } from '../DemoRoleBanner'
import { PWARegister } from '../PWARegister'

type QuickNavItem = {
  href: string
  label: string
  emoji: string
}

type AppFrameProps = {
  children: ReactNode
  title?: string
  subtitle?: string
  backHref?: string
  navItems?: QuickNavItem[]
  showMobileNav?: boolean
  className?: string
}

export function AppFrame({
  children,
  title = '부모님 케어',
  subtitle,
  backHref,
  navItems,
  showMobileNav = true,
  className = ''
}: AppFrameProps) {
  const showInternalLinks = process.env.NEXT_PUBLIC_SHOW_INTERNAL_LINKS === 'true'

  return (
    <main className={`min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F5FCFA_42%,#F7FBFF_100%)] pb-24 text-[#243F3B] md:pb-10 ${className}`}>
      <PWARegister />
      {showInternalLinks ? <DemoRoleBanner /> : null}

      <div className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-8">
        {(title || subtitle || backHref) ? (
          <section className="mb-6 rounded-[2rem] border border-[#E3F0ED] bg-white p-5 shadow-[0_12px_34px_rgba(82,112,108,0.08)] md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                {backHref ? (
                  <Link
                    href={backHref}
                    className="mb-3 inline-flex rounded-full bg-[#F3FBF9] px-3 py-1 text-sm font-black text-[#5D7774] ring-1 ring-[#DCECE8]"
                  >
                    이전
                  </Link>
                ) : null}

                {title ? (
                  <h1 className="text-3xl font-black tracking-[-0.06em] text-[#24423F] md:text-4xl">
                    {title}
                  </h1>
                ) : null}

                {subtitle ? (
                  <p className="mt-3 max-w-3xl text-base font-bold leading-7 text-[#78928E] md:text-lg md:leading-8">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {children}
      </div>

      {showMobileNav ? <MobileQuickNav items={navItems} /> : null}
    </main>
  )
}
