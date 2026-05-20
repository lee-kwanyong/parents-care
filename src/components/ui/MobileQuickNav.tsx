'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type QuickNavItem = {
  href: string
  label: string
  emoji: string
}

const appSelectItems: QuickNavItem[] = [
  { href: '/parent/today', label: '부모님 안심', emoji: '👵' },
  { href: '/care-request', label: '보호자 케어', emoji: '👨‍👩‍👧' },
  { href: '/manager', label: '케어파트너', emoji: '🧑‍⚕️' },
  { href: '/', label: '홈', emoji: '🏠' }
]

const childItems: QuickNavItem[] = [
  { href: '/app', label: '앱선택', emoji: '📱' },
  { href: '/care-request', label: '신청', emoji: '🟢' },
  { href: '/child/reports', label: '리포트', emoji: '📋' },
  { href: '/parent/today', label: '부모님', emoji: '👵' }
]

const parentItems: QuickNavItem[] = [
  { href: '/app', label: '앱선택', emoji: '📱' },
  { href: '/parent/today', label: '오늘안심', emoji: '🟢' },
  { href: 'tel:01012345678', label: '자녀전화', emoji: '☎️' },
  { href: '/parent/install', label: '앱설치', emoji: '⬇️' }
]

const managerItems: QuickNavItem[] = [
  { href: '/app', label: '앱선택', emoji: '📱' },
  { href: '/manager', label: '제안', emoji: '📩' },
  { href: '/manager/register', label: '등록', emoji: '📝' },
  { href: '/manager/install', label: '앱설치', emoji: '⬇️' }
]

const opsItems: QuickNavItem[] = [
  { href: '/ops', label: '운영실', emoji: '🧭' },
  { href: '/ops/intake', label: '접수', emoji: '📥' },
  { href: '/ops/managers', label: '매니저', emoji: '🧑‍⚕️' },
  { href: '/ops/matching', label: '매칭', emoji: '🔗' }
]

function pickItems(pathname: string) {
  if (pathname === '/app') return appSelectItems
  if (pathname.startsWith('/parent')) return parentItems
  if (pathname.startsWith('/manager')) return managerItems
  if (pathname.startsWith('/ops')) return opsItems
  if (pathname.startsWith('/child')) return childItems
  if (pathname.startsWith('/care-request')) return childItems
  if (pathname.startsWith('/care-intake')) return childItems

  return appSelectItems
}

export function MobileQuickNav({ items }: { items?: QuickNavItem[] }) {
  const pathname = usePathname()
  const navItems = (items && items.length > 0 ? items : pickItems(pathname)).slice(0, 4)

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
              <span className="block text-xl leading-none">{item.emoji}</span>
              <span className="mt-1 block">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
