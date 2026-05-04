import Link from 'next/link'
import type { ReactNode } from 'react'
import { MobileQuickNav } from './MobileQuickNav'
import { PWARegister } from '@/components/PWARegister'

type AppFrameProps = {
  children: ReactNode
  title?: string
  subtitle?: string
  backHref?: string
  navItems?: Array<{ href: string; label: string; emoji: string }>
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
  return (
    <main className={`min-h-screen bg-slate-50 pb-24 text-slate-950 md:pb-10 ${className}`}>
      <PWARegister />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {backHref ? (
                <Link href={backHref} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black">
                  이전
                </Link>
              ) : null}
              <Link href="/" className="truncate text-base font-black md:text-lg">
                {title}
              </Link>
            </div>
            {subtitle ? <p className="mt-1 truncate text-xs font-bold text-slate-500">{subtitle}</p> : null}
          </div>

          <div className="hidden gap-2 md:flex">
            <Link href="/care-intake" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
              사진·카톡 맡기기
            </Link>
            <Link href="/install" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              홈 화면 추가
            </Link>
            <Link href="/child" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black">
              자녀앱
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-10">
        {children}
      </div>

      {showMobileNav ? <MobileQuickNav items={navItems} /> : null}
    </main>
  )
}
