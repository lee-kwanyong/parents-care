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

const topNav = [
  { href: '/', label: '홈' },
  { href: '/care-request', label: '걱정 맡기기' },
  { href: '/care-intake', label: '사진·카톡' },
  { href: '/child', label: '자녀앱' },
  { href: '/parent/today', label: '부모님앱' },
  { href: '/manager', label: '매니저앱' },
  { href: '/ops', label: '운영실' }
]

export function AppFrame({
  children,
  title = '부모님 케어',
  subtitle,
  backHref,
  navItems,
  showMobileNav = true,
  className = ''
}: AppFrameProps) {
  return (
    <main className={`min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F3FBF9_42%,#F6FBFE_100%)] pb-24 text-[#314846] md:pb-10 ${className}`}>
      <PWARegister />
      <DemoRoleBanner />

      <header className="sticky top-0 z-40 border-b border-[#E3F0ED] bg-white px-5 py-3 md:px-8 shadow-[0_8px_24px_rgba(82,112,108,0.08)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {backHref ? (
                <Link
                  href={backHref}
                  className="rounded-full bg-[#F3FBF9] px-3 py-1 text-sm font-black text-[#5D7774] ring-1 ring-[#DCECE8]"
                >
                  이전
                </Link>
              ) : null}

              <Link href="/" className="truncate text-base font-black tracking-[-0.02em] text-[#345A56] md:text-lg">
                {title}
              </Link>
            </div>

            {subtitle ? (
              <p className="mt-1 truncate text-xs font-bold text-[#7A9692]">
                {subtitle}
              </p>
            ) : (
              <p className="mt-1 truncate text-xs font-bold text-[#7A9692]">
                부모님 걱정을 쉽게 맡기는 밝은 케어 플랫폼
              </p>
            )}
          </div>

          <nav className="hidden flex-wrap gap-2 lg:flex">
            {topNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full bg-[#F4FAF9] px-4 py-2 text-sm font-black text-[#5B7774] transition hover:bg-[#E5F8F4]"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/demo-start"
              className="rounded-full bg-[#E5F8F4] px-4 py-2 text-sm font-black text-[#3F706B] transition hover:bg-[#D7F0EA]"
            >
              데모
            </Link>

            <Link
              href="/buyer-demo"
              className="rounded-full bg-[#EAF6FC] px-4 py-2 text-sm font-black text-[#456F88] transition hover:bg-[#DDEFF8]"
            >
              바이어
            </Link>

            <Link
              href="/install"
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#5C7674] ring-1 ring-[#DCEBE8] transition hover:bg-[#FBFEFD]"
            >
              홈 화면 추가
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-8">
        {children}
      </div>

      {showMobileNav ? <MobileQuickNav items={navItems} /> : null}
    </main>
  )
}
