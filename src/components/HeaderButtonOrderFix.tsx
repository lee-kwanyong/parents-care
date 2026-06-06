'use client'

import { useEffect } from 'react'

export function HeaderButtonOrderFix() {
  useEffect(() => {
    function reorderHeaderButtons() {
      const roots = Array.from(document.querySelectorAll('header, nav, body'))

      for (const root of roots) {
        const clickable = Array.from(root.querySelectorAll('a, button')) as HTMLElement[]

        const menu = clickable.find((item) => item.textContent?.trim() === '메뉴')
        const login = clickable.find((item) => item.textContent?.includes('로그인/회원가입'))

        if (!menu || !login) continue

        const menuParent = menu.parentElement
        const loginParent = login.parentElement

        if (!menuParent || menuParent !== loginParent) continue

        const children = Array.from(menuParent.children)
        const menuIndex = children.indexOf(menu)
        const loginIndex = children.indexOf(login)

        if (menuIndex >= 0 && loginIndex >= 0 && menuIndex < loginIndex) {
          menuParent.insertBefore(login, menu)
        }
      }
    }

    reorderHeaderButtons()

    const timer = window.setTimeout(reorderHeaderButtons, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  return null
}

export default HeaderButtonOrderFix
