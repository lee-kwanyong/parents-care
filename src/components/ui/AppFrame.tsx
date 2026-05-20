import Link from 'next/link'
import type { ReactNode } from 'react'
import { MobileQuickNav } from './MobileQuickNav'
import { DemoRoleBanner } from '../DemoRoleBanner'
import { PWARegister } from '../PWARegister'
import { BrandLogo } from '../BrandLogo'

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
  { href: '/app', label: '앱 선택' },
  { href: '/', label: '홈' },
  { href: '/care-request', label: '부모님 안심케어하기' },
  { href: '/care-intake', label: '사진·카톡' },
  { href: '/child/reports', label: '보호자리포트' },
  { href: '/parent/today', label: '부모님 안심' },
  { href: '/install', label: '홈 화면 추가' }
]

const internalNav = [
  { href: '/ops', label: '운영실' },
  { href: '/ops/intake', label: '운영접수' },
  { href: '/ops/managers', label: '매니저관리' },
  { href: '/ops/matching', label: '매칭관리' },
  { href: '/manager', label: '케어파트너' },
  { href: '/manager/register', label: '매니저 등록' }
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
  const showInternalLinks = false
  const nav = publicNav

  return (
    <main className={`min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F5FCFA_42%,#F7FBFF_100%)] pb-28 text-[#243F3B] md:pb-10 ${className}`}>
      <PWARegister />
      {false ? <DemoRoleBanner /> : null}

      <header className="sticky top-0 z-40 border-b border-[#E3F0ED] bg-white px-5 py-3 shadow-[0_8px_24px_rgba(82,112,108,0.08)] md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {backHref ? (
                <Link
                  href={backHref}
                  className="rounded-full bg-[#F3FBF9] px-3 py-1 text-sm font-black text-[#5D7774] ring-1 ring-[#DCECE8]"
                >
                  이전
                </Link>
              ) : null}

              <BrandLogo
                title={title}
                subtitle={subtitle || '부모님 안심케어를 쉽게 시작하는 케어 플랫폼'}
                compact
              />
            </div>
          </div>

          <nav className="hidden max-w-5xl flex-wrap justify-end gap-2 lg:flex">
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
              href="/app"
              className="rounded-full bg-[#19B99A] px-4 py-2 text-sm font-black text-white shadow-[0_8px_20px_rgba(25,185,154,0.18)] transition hover:bg-[#16A98D]"
            >
              앱 선택
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
