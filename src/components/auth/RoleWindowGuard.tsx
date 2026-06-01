'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { readParentCode } from '@/components/auth/ParentSessionBridge'

function hideRoleButtons() {
  const pathname = window.location.pathname
  const isRolePage =
    pathname.startsWith('/parent') ||
    pathname.startsWith('/child') ||
    pathname.startsWith('/ops')

  if (!isRolePage) return

  const blockedTexts = [
    '회원정보',
    '로그인 / 회원가입',
    '로그인·회원가입',
    '보호자 회원가입',
    '부모님 6자리 접속',
    '운영실 Admin',
    '케어파트너 지원'
  ]

  const candidates = Array.from(document.querySelectorAll('a, button, [role="button"]')) as HTMLElement[]

  for (const el of candidates) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
    const href = (el.getAttribute('href') || '').trim()

    const isBlockedText = blockedTexts.some((blocked) => text === blocked || text.includes(blocked))
    const isBlockedHref =
      href === '/login' ||
      href === '/account' ||
      href === '/signup/guardian' ||
      href === '/ops/login' ||
      href === '/care-partner/apply'

    if (isBlockedText || isBlockedHref) {
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      const isFloating =
        style.position === 'fixed' ||
        style.position === 'sticky' ||
        rect.bottom > window.innerHeight - 180 ||
        rect.top < 140

      if (pathname.startsWith('/parent') || pathname.startsWith('/child') || isFloating) {
        el.style.display = 'none'
        el.setAttribute('aria-hidden', 'true')
      }
    }
  }
}

export function RoleWindowGuard() {
  const pathname = usePathname() || ''

  useEffect(() => {
    hideRoleButtons()

    const observer = new MutationObserver(() => {
      hideRoleButtons()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    window.addEventListener('focus', hideRoleButtons)
    window.addEventListener('scroll', hideRoleButtons)

    return () => {
      observer.disconnect()
      window.removeEventListener('focus', hideRoleButtons)
      window.removeEventListener('scroll', hideRoleButtons)
    }
  }, [pathname])

  useEffect(() => {
    if (pathname === '/login') {
      const code = readParentCode()

      if (/^\d{6}$/.test(code)) {
        window.location.replace('/parent/today')
      }
    }
  }, [pathname])

  return null
}

export default RoleWindowGuard
