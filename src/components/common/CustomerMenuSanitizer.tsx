'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const FORBIDDEN_HREF_PARTS = [
  '/admin',
  '/admin-menu',
  '/ops',
  '/portal/ops',
  '/gov',
  '/b2g',
  '/rnd',
  '/r-and-d',
  '/municipal',
  '/public-office'
]

const FORBIDDEN_TEXT_PARTS = [
  '운영실',
  '운영센터',
  '운영 대시보드',
  'Admin',
  '어드민',
  '지자체',
  'B2G',
  'R&D',
  'Gov',
  'CSV 업로드',
  '스마트링 CSV',
  '스마트링 리포트 실험실',
  '리포트 실험실',
  '알림 발송센터',
  '알림 발송',
  '상황별 자동문자',
  '문자 자동화',
  '문자 비용',
  '실증 운영센터',
  '오늘 운영센터',
  '오늘 실증 운영센터',
  '전체 기능 테스트',
  '프리플라이트',
  '제안 표현 점검',
  '동의·책임범위',
  '책임범위 센터',
  '자체 예비 실증',
  '가입자 관리',
  '미응답 관리',
  '초대 링크 센터',
  '지자체·R&D',
  'B2G/R&D',
  '바이오헬스',
  '조달',
  '관제'
]

const CUSTOMER_ALLOW_TEXT_PARTS = [
  '홈',
  '시작하기',
  '실증 참여 동의',
  '부모님 안부 앱',
  '보호자 오늘 리포트',
  '스마트링 안부리듬 리포트',
  '보호자 대리입력',
  '사용 가이드',
  '보호자 가이드',
  '부모님 가이드',
  '로그인',
  '회원가입',
  '메뉴'
]

function normalize(value: string) {
  return value.replace(/\s+/g, '').toLowerCase()
}

function isAdminPath(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/ops') ||
    pathname.startsWith('/portal/ops')
  )
}

function shouldAllowText(text: string) {
  const compact = normalize(text)

  return CUSTOMER_ALLOW_TEXT_PARTS.some((allowed) =>
    compact.includes(normalize(allowed))
  )
}

function shouldHideByHref(href: string) {
  if (!href) return false

  return FORBIDDEN_HREF_PARTS.some((part) => href.includes(part))
}

function shouldHideByText(text: string) {
  if (!text) return false

  if (shouldAllowText(text)) return false

  const compact = normalize(text)

  return FORBIDDEN_TEXT_PARTS.some((part) =>
    compact.includes(normalize(part))
  )
}

function hideElement(element: Element) {
  const target =
    element.closest('li') ||
    element.closest('[role="menuitem"]') ||
    element.closest('[data-menu-item]') ||
    element.closest('a') ||
    element.closest('button') ||
    element

  if (target instanceof HTMLElement) {
    target.dataset.anbuPublicHiddenAdminMenu = 'true'
    target.style.setProperty('display', 'none', 'important')
    target.style.setProperty('visibility', 'hidden', 'important')
    target.style.setProperty('pointer-events', 'none', 'important')
  }
}

function sanitizePublicMenu() {
  const candidates = Array.from(
    document.querySelectorAll('a, button, [role="menuitem"]')
  )

  for (const element of candidates) {
    const text = element.textContent || ''
    const href =
      element instanceof HTMLAnchorElement
        ? element.getAttribute('href') || ''
        : element.getAttribute('href') || ''

    if (shouldHideByHref(href) || shouldHideByText(text)) {
      hideElement(element)
    }
  }
}

export function CustomerMenuSanitizer() {
  const pathname = usePathname() || '/'

  useEffect(() => {
    if (isAdminPath(pathname)) return

    sanitizePublicMenu()

    const observer = new MutationObserver(() => {
      sanitizePublicMenu()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'class', 'style', 'aria-expanded']
    })

    const interval = window.setInterval(sanitizePublicMenu, 600)

    return () => {
      observer.disconnect()
      window.clearInterval(interval)
    }
  }, [pathname])

  if (isAdminPath(pathname)) return null

  return (
    <style jsx global>{`
      [data-anbu-public-hidden-admin-menu='true'] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `}</style>
  )
}

export default CustomerMenuSanitizer
