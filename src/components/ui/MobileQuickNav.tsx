'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type IconName =
  | 'menu'
  | 'home'
  | 'parent'
  | 'guardian'
  | 'partner'
  | 'signup'
  | 'code'
  | 'matching'
  | 'report'
  | 'request'
  | 'phone'
  | 'install'
  | 'offer'

type QuickNavItem = {
  href: string
  label: string
  emoji?: string
  icon?: IconName
}

const appSelectItems: QuickNavItem[] = [
  { href: '/parent/login', label: '부모님', icon: 'parent' },
  { href: '/login', label: '보호자', icon: 'guardian' },
  { href: '/signup/manager', label: '파트너', icon: 'partner' },
  { href: '/app', label: '메뉴', icon: 'menu' }
]

const guardianSignupItems: QuickNavItem[] = [
  { href: '/login', label: '가입', icon: 'signup' },
  { href: '/parent/login', label: '부모님', icon: 'code' },
  { href: '/child/matching', label: '매칭', icon: 'matching' },
  { href: '/app', label: '메뉴', icon: 'menu' }
]

const guardianItems: QuickNavItem[] = [
  { href: '/care-request', label: '신청', icon: 'request' },
  { href: '/child/matching', label: '매칭', icon: 'matching' },
  { href: '/child/reports', label: '리포트', icon: 'report' },
  { href: '/app', label: '메뉴', icon: 'menu' }
]

const parentItems: QuickNavItem[] = [
  { href: '/parent/login', label: '코드접속', icon: 'code' },
  { href: '/parent/today', label: '오늘안심', icon: 'request' },
  { href: 'tel:01012345678', label: '자녀전화', icon: 'phone' },
  { href: '/app', label: '메뉴', icon: 'menu' }
]

const managerItems: QuickNavItem[] = [
  { href: '/signup/manager', label: '지원', icon: 'signup' },
  { href: '/manager', label: '제안', icon: 'offer' },
  { href: '/manager/install', label: '앱설치', icon: 'install' },
  { href: '/app', label: '메뉴', icon: 'menu' }
]

function pickItems(pathname: string) {
  if (pathname === '/app') return appSelectItems
  if (pathname.startsWith('/login')) return guardianSignupItems
  if (pathname.startsWith('/parent')) return parentItems
  if (pathname.startsWith('/manager')) return managerItems
  if (pathname.startsWith('/signup/manager')) return managerItems
  if (pathname.startsWith('/child')) return guardianItems
  if (pathname.startsWith('/care-request')) return guardianItems
  if (pathname.startsWith('/care-intake')) return guardianItems

  return appSelectItems
}

function NavIcon({ item }: { item: QuickNavItem }) {
  if (item.emoji) {
    return <span className="block text-xl leading-none">{item.emoji}</span>
  }

  const common = 'mx-auto h-5 w-5'

  switch (item.icon) {
    case 'menu':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13a1.5 1.5 0 0 1 0 3h-13A1.5 1.5 0 0 1 4 6.5Zm0 5.5A1.5 1.5 0 0 1 5.5 10.5h13a1.5 1.5 0 0 1 0 3h-13A1.5 1.5 0 0 1 4 12Zm0 5.5A1.5 1.5 0 0 1 5.5 16h13a1.5 1.5 0 0 1 0 3h-13A1.5 1.5 0 0 1 4 17.5Z"
          />
        </svg>
      )
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M12 3 3 10.5l1.8 2.1L6 11.6V20h6v-5h2v5h6v-8.4l1.2 1 1.8-2.1L12 3Z" />
        </svg>
      )
    case 'parent':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0v1H5v-1Z" />
        </svg>
      )
    case 'guardian':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M8 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 11Zm8 0a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 16 11ZM2.5 20.5A5.5 5.5 0 0 1 8 15h.6a7 7 0 0 0-1.1 4v1.5h-5Zm6 0V19a5.5 5.5 0 0 1 11 0v1.5h-11Z" />
        </svg>
      )
    case 'partner':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M12 3a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v9h16v-9a2 2 0 0 0-2-2h-2V7a4 4 0 0 0-4-4Zm-1 11H8v-2h3V9h2v3h3v2h-3v3h-2v-3Zm3-6h-4V7a2 2 0 0 1 4 0v1Z" />
        </svg>
      )
    case 'signup':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 10.2-6.2l-2.1 2.1A4 4 0 0 0 8 20H5Zm15.7-8.3 1.6 1.6-7.8 7.8H13v-1.5l7.7-7.9Z" />
        </svg>
      )
    case 'code':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M7 4h10a2 2 0 0 1 2 2v16H5V6a2 2 0 0 1 2-2Zm2 4v3h3V8H9Zm5 0v3h3V8h-3Zm-5 5v3h3v-3H9Zm5 0v3h3v-3h-3Z" />
        </svg>
      )
    case 'matching':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M7 7h6a4 4 0 0 1 0 8h-1v-3h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1v3H7A4 4 0 0 1 7 7Zm4 3h2v4h-2v-4Zm2 5h6a4 4 0 0 0 0-8h-1v3h1a1 1 0 0 1 0 2h-6a1 1 0 0 1 0-2h1V7h-1a4 4 0 0 0 0 8Z" />
        </svg>
      )
    case 'report':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M6 3h9l3 3v18H6V3Zm2 5h8V6.8L14.2 5H8v3Zm0 4h8v2H8v-2Zm0 4h8v2H8v-2Z" />
        </svg>
      )
    case 'request':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M12 21s-7-4.6-9.3-8.5C.8 9.3 2.7 4.7 6.6 4.2A5.2 5.2 0 0 1 12 6.7a5.2 5.2 0 0 1 5.4-2.5c3.9.5 5.8 5.1 3.9 8.3C19 16.4 12 21 12 21Z" />
        </svg>
      )
    case 'phone':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M7 2h10a2 2 0 0 1 2 2v20H5V4a2 2 0 0 1 2-2Zm3 19h4v-2h-4v2Z" />
        </svg>
      )
    case 'install':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M11 3h2v9l3-3 1.4 1.4L12 15.8l-5.4-5.4L8 9l3 3V3ZM5 18h14v2H5v-2Z" />
        </svg>
      )
    case 'offer':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M3 5h18v14H3V5Zm2 3v1l7 4 7-4V8l-7 4-7-4Z" />
        </svg>
      )
    default:
      return <span className="block text-xl leading-none">•</span>
  }
}

export function MobileQuickNav({ items }: { items?: QuickNavItem[] }) {
  const pathname = usePathname()
  const navItems = (items && items.length > 0 ? items : pickItems(pathname)).slice(0, 6)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E0EFEC] bg-white/95 px-3 py-2 shadow-[0_-12px_35px_rgba(93,139,131,0.15)] backdrop-blur md:hidden">
      <div
        className="mx-auto grid max-w-md gap-1"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const active =
            item.href !== '/' &&
            item.href !== '/app' &&
            item.href.startsWith('/') &&
            pathname.startsWith(item.href.replace(/\?.*$/, ''))

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={
                'rounded-2xl px-2 py-2 text-center text-xs font-black transition active:bg-[#E5F8F4] ' +
                (active ? 'bg-[#E5F8F4] text-[#159B84]' : 'text-[#5B7774]')
              }
            >
              <span className="block leading-none">
                <NavIcon item={item} />
              </span>
              <span className="mt-1 block">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
