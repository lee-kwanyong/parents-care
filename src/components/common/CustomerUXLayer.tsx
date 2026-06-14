'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const customerQuickLinks = [
  {
    href: '/',
    label: '홈',
    short: '홈'
  },
  {
    href: '/mobile/parent',
    label: '부모님 안부',
    short: '부모님'
  },
  {
    href: '/guardian/today',
    label: '보호자 리포트',
    short: '리포트'
  },
  {
    href: '/guardian/ring-report',
    label: '스마트링 리포트',
    short: '링'
  },
  {
    href: '/guide',
    label: '가이드',
    short: '가이드'
  }
]

function isAdminPath(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/ops') ||
    pathname.startsWith('/portal/ops') ||
    pathname.startsWith('/api')
  )
}

function pageLabel(pathname: string) {
  if (pathname.startsWith('/mobile/parent')) return '부모님 화면'
  if (pathname.startsWith('/guardian/ring-report')) return '스마트링 리포트'
  if (pathname.startsWith('/guardian/today')) return '보호자 리포트'
  if (pathname.startsWith('/guardian/proxy-checkin')) return '보호자 대리입력'
  if (pathname.startsWith('/consent')) return '실증 참여 동의'
  if (pathname.startsWith('/onboarding')) return '시작하기'
  if (pathname.startsWith('/guide')) return '가이드'
  return '안부웍스'
}

export function CustomerUXLayer() {
  const pathname = usePathname() || '/'

  useEffect(() => {
    const area = isAdminPath(pathname) ? 'admin' : 'customer'
    document.documentElement.dataset.anbuArea = area
    document.documentElement.dataset.anbuPage = pageLabel(pathname)
  }, [pathname])

  if (isAdminPath(pathname)) return null

  return (
    <>
      <div className="anbu-customer-page-chip" aria-hidden="true">
        {pageLabel(pathname)}
      </div>

      <nav className="anbu-customer-quickbar" aria-label="고객 빠른 이동">
        {customerQuickLinks.map((link) => {
          const active =
            link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? 'is-active' : ''}
            >
              <span className="full">{link.label}</span>
              <span className="short">{link.short}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export default CustomerUXLayer
