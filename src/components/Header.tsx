'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { readParentCode } from '@/components/auth/ParentSessionBridge'

type Role = 'guest' | 'parent' | 'guardian' | 'ops'

function getRole(pathname: string): Role {
  if (pathname.startsWith('/parent')) return 'parent'
  if (pathname.startsWith('/child')) return 'guardian'
  if (pathname.startsWith('/ops')) return 'ops'

  if (typeof window === 'undefined') return 'guest'

  const role = window.localStorage.getItem('anbu_login_role')
  const parentCode = readParentCode()

  if (/^\d{6}$/.test(parentCode) || role === 'parent') return 'parent'
  if (role === 'guardian' || window.localStorage.getItem('anbu_guardian_profile')) return 'guardian'

  return 'guest'
}

export function GlobalHeader() {
  const pathname = usePathname() || '/'
  const [role, setRole] = useState<Role>('guest')

  function refresh() {
    setRole(getRole(pathname))
  }

  useEffect(() => {
    refresh()

    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('anbu-auth-changed', refresh)
    window.addEventListener('anbu-parent-session-changed', refresh)

    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('anbu-auth-changed', refresh)
      window.removeEventListener('anbu-parent-session-changed', refresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const parentLinks = [
    { href: '/parent/today', label: '안부 버튼' },
    { href: '/parent/consent', label: '안심동의' },
    { href: '/parent/login', label: '코드 입력' }
  ]

  const guardianLinks = [
    { href: '/child/dashboard', label: '부모님 케어' },
    { href: '/family-link', label: '자녀-부모 연결' }
  ]

  const opsLinks = [
    { href: '/ops/pilot', label: '실증 운영실' },
    { href: '/ops/risk-action', label: 'Risk-to-Action' },
    { href: '/ops/outcomes', label: '결과 라벨링' }
  ]

  const guestLinks = [
    { href: '/', label: '홈' },
    { href: '/signup/guardian', label: '보호자 시작' },
    { href: '/parent/login', label: '부모님 코드입력' },
    { href: '/login', label: '역할 선택' }
  ]

  const links =
    role === 'parent'
      ? parentLinks
      : role === 'guardian'
        ? guardianLinks
        : role === 'ops'
          ? opsLinks
          : guestLinks

  return (
    <header className="sticky top-0 z-50 border-b border-[#D8EEE8] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href={role === 'parent' ? '/parent/today' : role === 'guardian' ? '/child/dashboard' : '/'} className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#DFF7F0] text-xl">
            ♡
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-black tracking-[-0.05em] text-[#173B36]">
              부모님 안심케어
            </span>
            <span className="block truncate text-[11px] font-bold text-[#5F7D77]">
              {role === 'parent'
                ? '부모님 전용 안부 화면'
                : role === 'guardian'
                  ? '보호자 부모님 케어'
                  : role === 'ops'
                    ? '운영실'
                    : 'by 안부웍스'}
            </span>
          </span>
        </Link>

        <nav className="flex max-w-[58vw] items-center gap-2 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full bg-[#F8FCFB] px-4 py-2 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

export const Header = GlobalHeader
export default GlobalHeader
