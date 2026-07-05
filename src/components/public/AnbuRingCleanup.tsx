'use client'

import { useEffect } from 'react'

function shouldTreatAsRing(text: string | null | undefined) {
  const clean = (text || '').replace(/\s+/g, '').trim()
  return clean === '고객센터' || clean === 'Support' || clean === 'support'
}

function hasRingPath(value: string | null | undefined) {
  const target = value || ''
  return (
    target.includes('/support') ||
    target.includes('/support') ||
    target.includes('/support') ||
    target.includes('/support') ||
    target.includes('/support')
  )
}

export function AnbuRingCleanup() {
  useEffect(() => {
    const cleanup = () => {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>('a, button, [role="button"], nav *')
      )

      for (const element of elements) {
        const text = element.textContent

        if (shouldTreatAsRing(text)) {
          element.textContent = '고객센터'
          element.setAttribute('aria-label', '고객센터')
          element.setAttribute('data-anbu-replaced-ring', 'true')
        }

        if (element instanceof HTMLAnchorElement) {
          if (hasRingPath(element.getAttribute('href')) || hasRingPath(element.href)) {
            element.setAttribute('href', '/support')
            element.setAttribute('aria-label', '고객센터')
            if (shouldTreatAsRing(element.textContent)) {
              element.textContent = '고객센터'
            }
          }
        }

        const href = element.getAttribute('href')
        const dataHref = element.getAttribute('data-href')
        const dataPath = element.getAttribute('data-path')

        if (hasRingPath(href)) element.setAttribute('href', '/support')
        if (hasRingPath(dataHref)) element.setAttribute('data-href', '/support')
        if (hasRingPath(dataPath)) element.setAttribute('data-path', '/support')
      }
    }

    cleanup()

    const observer = new MutationObserver(() => cleanup())
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['href', 'data-href', 'data-path']
    })

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const closest = target?.closest('a, button, [role="button"]') as HTMLElement | null

      if (!closest) return

      const text = closest.textContent || ''
      const href = closest.getAttribute('href') || ''

      if (shouldTreatAsRing(text) || hasRingPath(href)) {
        event.preventDefault()
        window.location.href = '/support'
      }
    }

    document.addEventListener('click', onClick, true)

    return () => {
      observer.disconnect()
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  return null
}
