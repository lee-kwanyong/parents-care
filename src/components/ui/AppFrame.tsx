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

const publicNav = [
  { href: '/', label: '홈' },
  { href: '/care-request', label: '부모님 안심케어하기' },
  { href: '/care-intake', label: '사진·카톡' },
  { href: '/parent/today', label: '부모님앱' },
  { href: '/manager/register', label: '매니저 등록' },
  { href: '/manager', label: '매니저앱' },
  { href: '/ops/matching', label: '매칭관리' },
  { href: '/install', label: '홈 화면 추가' }
]

const internalNav = [
  { href: '/ops', label: '운영실' },
  { href: '/ops/matching', label: '매칭관리' },
  { href: '/manager', label: '매니저앱' },
  { href: '/manager/register', label: '매니저 등록' },
  { href: '/demo-start', label: '데모' },
  { href: '/buyer-demo', label: '바이어' },
  { href: '/deploy-readiness', label: '배포 점검' }
]

export function AppFrame({
  children,
  title = '부모님 안심케어',
  subtitle,
  backHref,
  navItems,
  showMobileNav = true,
  className = ''
}: AppFrameProps) {
  const showInternalLinks = process.env.NEXT_PUBLIC_SHOW_INTERNAL_LINKS === 'true'
  const nav = showInternalLinks ? [...publicNav, ...internalNav] : publicNav

  return (
    <main className={`min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F5FCFA_42%,#F7FBFF_100%)] pb-24 text-[#243F3B] md:pb-10 ${className}`}>
      <PWARegister />
      {showInternalLinks ? <DemoRoleBanner /> : null}

      <header className="sticky top-0 z-40 border-b border-[#E3F0ED] bg-white px-5 py-3 shadow-[0_8px_24px_rgba(82,112,108,0.08)] md:px-8">
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

              <Link
                href="/"
                aria-label="부모님 안심케어 홈"
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#DCF8F1] ring-1 ring-[#DDEEEA]"
              >
                <img src="/icons/parents-care-icon.svg" alt="부모님 안심케어 로고" className="h-8 w-8 rounded-xl" />
              </Link>

              <Link href="/" className="truncate text-base font-black tracking-[-0.02em] text-[#244F49] md:text-lg">
                {title}
              </Link>
            </div>

            <p className="mt-1 truncate text-xs font-bold text-[#78928E]">
              {subtitle || '부모님 안심케어를 쉽게 시작하는 케어 플랫폼'}
            </p>
          </div>

          <nav className="hidden flex-wrap gap-2 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full bg-[#F4FAF9] px-4 py-2 text-sm font-black text-[#5B7774] transition hover:bg-[#E5F8F4]"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/login"
              className="rounded-full bg-[#19B99A] px-4 py-2 text-sm font-black text-white shadow-[0_8px_20px_rgba(25,185,154,0.18)] transition hover:bg-[#16A98D]"
            >
              로그인
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
