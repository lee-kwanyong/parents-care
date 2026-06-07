'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    const manifestHref = '/manifest.webmanifest'

    if (!document.querySelector(`link[rel="manifest"][href="${manifestHref}"]`)) {
      const link = document.createElement('link')
      link.rel = 'manifest'
      link.href = manifestHref
      document.head.appendChild(link)
    }

    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = '#247A71'
      document.head.appendChild(meta)
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/anbu-sw.js').catch(() => {
          // Service worker registration is best-effort.
        })
      })
    }
  }, [])

  return null
}

export default PwaRegister
