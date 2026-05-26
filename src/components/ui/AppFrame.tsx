import Link from 'next/link'
import type { ReactNode } from 'react'

type QuickNavItem = {
  href: string
  label: string
  emoji?: string
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
  title,
  subtitle,
  backHref,
  navItems,
  showMobileNav = true,
  className = ''
}: AppFrameProps) {
  return (
    <main className={`min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F5FCFA_42%,#F7FBFF_100%)] pb-24 text-[#243F3B] md:pb-10 ${className}`}>
      <div className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-8">
        {(title || subtitle || backHref) ? (
          <section className="mb-6 rounded-[2rem] border border-[#E3F0ED] bg-white p-5 shadow-[0_12px_34px_rgba(82,112,108,0.08)] md:p-6">
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
          </section>
        ) : null}

        {children}
      </div>

      {showMobileNav && navItems?.length ? (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E3F0ED] bg-white/95 px-3 py-2 shadow-[0_-8px_24px_rgba(82,112,108,0.08)] backdrop-blur md:hidden">
          <div className="grid grid-cols-4 gap-2">
            {navItems.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-2 py-2 text-center text-xs font-black text-[#537875] hover:bg-[#F2FAF8]"
              >
                <span className="block text-lg">{item.emoji || '•'}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </main>
  )
}
