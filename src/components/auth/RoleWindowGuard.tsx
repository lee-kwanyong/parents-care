'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { readParentCode } from '@/components/auth/ParentSessionBridge'

function hideWrongRoleButtons() {
  const pathname = window.location.pathname
  const isParent = pathname.startsWith('/parent')
  const isChild = pathname.startsWith('/child')
  const isOps = pathname.startsWith('/ops')

  if (!isParent && !isChild && !isOps) return

  const blockedTexts = [
    '로그인 / 회원가입',
    '로그인·회원가입',
    '회원정보',
    '보호자 회원가입',
    '케어파트너 지원',
    '운영실 Admin',
    '사진 카톡으로 맡기기',
    '부모님 안심케어하기',
    '홈화면에 추가하기'
  ]

  const candidates = Array.from(document.querySelectorAll('a, button, [role="button"]')) as HTMLElement[]

  for (const el of candidates) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
    const href = (el.getAttribute('href') || '').trim()

    const blockedText = blockedTexts.some((blocked) => text === blocked || text.includes(blocked))
    const blockedHref =
      href === '/login' ||
      href === '/account' ||
      href === '/signup/guardian' ||
      href === '/care-partner/apply' ||
      href === '/ops/login'

    if (blockedText || blockedHref) {
      el.style.display = 'none'
      el.setAttribute('aria-hidden', 'true')
    }
  }
}

export function RoleWindowGuard() {
  const pathname = usePathname() || ''

  useEffect(() => {
    hideWrongRoleButtons()

    const observer = new MutationObserver(() => hideWrongRoleButtons())

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    window.addEventListener('focus', hideWrongRoleButtons)
    window.addEventListener('scroll', hideWrongRoleButtons)

    return () => {
      observer.disconnect()
      window.removeEventListener('focus', hideWrongRoleButtons)
      window.removeEventListener('scroll', hideWrongRoleButtons)
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
