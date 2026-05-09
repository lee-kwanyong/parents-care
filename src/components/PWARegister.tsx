'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    async function clearDevServiceWorker() {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))

        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((key) => caches.delete(key)))
        }
      } catch {
        return undefined
      }
    }

    if (process.env.NODE_ENV !== 'production' || isLocalhost) {
      clearDevServiceWorker()
      return
    }

    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  }, [])

  return null
}
