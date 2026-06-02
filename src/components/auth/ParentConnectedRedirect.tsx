'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { readParentSession } from '@/components/auth/ParentSessionBridge'

function isParentAllowedPath(pathname: string) {
  if (pathname.startsWith('/parent')) return true
  if (pathname.startsWith('/install')) return true
  if (pathname.startsWith('/api')) return true
  if (pathname.startsWith('/_next')) return true
  return false
}

export function ParentConnectedRedirect() {
  const pathname = usePathname() || '/'

  useEffect(() => {
    const session = readParentSession()

    if (!session) return

    if (pathname === '/parent/login') {
      window.location.replace('/parent/today?connected=1')
      return
    }

    if (!isParentAllowedPath(pathname)) {
      window.location.replace('/parent/today?connected=1')
    }
  }, [pathname])

  return null
}

export default ParentConnectedRedirect
