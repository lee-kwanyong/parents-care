import type { Metadata, Viewport } from 'next'
import './globals.css'

import { AppPermissionBootstrap } from '@/components/AppPermissionBootstrap'
import { GlobalHeader } from '@/components/GlobalHeader'
import { AuthSessionBridge } from '@/components/auth/AuthSessionBridge'
import { MobileLoginButton } from '@/components/auth/MobileLoginButton'

export const metadata: Metadata = {
  title: '안부웍스 | 부모님 안심케어',
  description: 'AI 안부온과 케어파트너 연결로 부모님 안부를 매일 확인하는 안심관리 플랫폼',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/parents-care-icon.svg',
    apple: '/icons/parents-care-icon.svg'
  }
}

export const viewport: Viewport = {
  themeColor: '#19B99A',
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppPermissionBootstrap />
        <GlobalHeader />
        {children}
              <AuthSessionBridge />
              <MobileLoginButton />
      </body>
    </html>
  )
}