import Link from 'next/link'
import type { ReactNode } from 'react'
import { MobileQuickNav } from './MobileQuickNav'
import { PWARegister } from '../PWARegister'
import { BrandLogo } from '../BrandLogo'
import { LoginStatusBadge } from '@/components/auth/LoginStatusBadge'

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

const primaryNav = [
  { href: '/', label: '홈' },
  { href: '/care-request', label: '안심케어' },
  { href: '/signup/guardian', label: '보호자 가입' },
  { href: '/child/matching', label: '매칭' },
  { href: '/parent/login', label: '부모님 접속' }
]

const menuNav = [
  { href: '/app', label: '앱 선택' },
  { href: '/care-intake', label: '사진·카톡' },
  { href: '/care-scope', label: '케어 범위' },
  { href: '/trust', label: '신뢰 기준' },
  { href: '/pricing', label: '금액 안내' },
  { href: '/signup/manager', label: '케어파트너' },
  { href: '/install', label: '홈 화면 추가' },
  { href: '/admin', label: '운영실 Admin' }
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
  return (
    <main className={`min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F5FCFA_42%,#F7FBFF_100%)] pb-28 text-[#243F3B] md:pb-10 ${className}`}>
      <PWARegister />

      <header className="sticky top-0 z-40 border-b border-[#E3F0ED] bg-white/95 px-4 py-2 shadow-[0_8px_24px_rgba(82,112,108,0.08)] backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {backHref ? (
                <Link
                  href={backHref}
                  className="shrink-0 rounded-full bg-[#F3FBF9] px-3 py-1 text-sm font-black text-[#5D7774] ring-1 ring-[#DCECE8]"
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

          <div className="hidden flex-col items-end gap-2 lg:flex">
            <LoginStatusBadge />

            <nav className="flex flex-nowrap items-center justify-end gap-2">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full bg-[#F4FAF9] px-4 py-2 text-sm font-black text-[#5B7774] transition hover:bg-[#E5F8F4]"
                >
                  {item.label}
                </Link>
              ))}

              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full bg-[#19B99A] px-4 py-2 text-sm font-black text-white shadow-[0_8px_20px_rgba(25,185,154,0.18)] transition hover:bg-[#16A98D]">
                  <span className="text-base leading-none">☰</span>
                  메뉴
                </summary>

                <div className="absolute right-0 mt-2 w-56 rounded-3xl border border-[#E3EFEC] bg-white p-2 shadow-[0_18px_50px_rgba(93,139,131,0.18)]">
                  {menuNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-2xl px-4 py-3 text-sm font-black text-[#426C68] transition hover:bg-[#F4FAF9]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <Link
              href="/app"
              className="rounded-full bg-[#19B99A] px-4 py-2 text-sm font-black text-white shadow-[0_8px_20px_rgba(25,185,154,0.18)]"
            >
              ☰ 메뉴
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-2 max-w-7xl lg:hidden">
          <LoginStatusBadge />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-5 md:px-8 md:py-8">
        {children}
      </div>

      {showMobileNav ? <MobileQuickNav items={navItems} /> : null}
    </main>
  )
}
