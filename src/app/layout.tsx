import type { Metadata, Viewport } from 'next'
import './globals.css'
import './customer-ui-polish.css'
import './anbu-theme-tokens.css'
import './anbu-logo-soft-theme.css'

import { AppPermissionBootstrap } from '@/components/AppPermissionBootstrap'
import { GlobalHeader } from '@/components/GlobalHeader'
import { AuthSessionBridge } from '@/components/auth/AuthSessionBridge'
import { MobileLoginButton } from '@/components/auth/MobileLoginButton'
import { ParentSessionBridge } from '@/components/auth/ParentSessionBridge'
import { AnbuAuthPersistence } from '@/components/auth/AnbuAuthPersistence'
import { GuardianLoginRequiredGuard } from '@/components/auth/GuardianLoginRequiredGuard'
import { ParentOnlyGuard } from '@/components/auth/ParentOnlyGuard'
import { ParentConnectedRedirect } from '@/components/auth/ParentConnectedRedirect'
import { HeaderButtonOrderFix } from '@/components/HeaderButtonOrderFix'
import { PwaRegister } from '@/components/pwa/PwaRegister'
import { CustomerMenuSanitizer } from '@/components/common/CustomerMenuSanitizer'
import { CustomerUXLayer } from '@/components/common/CustomerUXLayer'
import { AnbuBusinessFooter } from '@/components/public/AnbuBusinessFooter'
import { AnbuSupportCenter } from '@/components/support/AnbuSupportCenter'
import { AnbuRingCleanup } from '@/components/public/AnbuRingCleanup'

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
        <CustomerUXLayer />
        <CustomerMenuSanitizer />
        <PwaRegister />
        <HeaderButtonOrderFix />
        <ParentConnectedRedirect />
        <AnbuAuthPersistence />
        <ParentSessionBridge />
        <GuardianLoginRequiredGuard />
        <ParentOnlyGuard />
        <GlobalHeader />
        <AppPermissionBootstrap />
        {children}
        <AnbuBusinessFooter />
        <AnbuSupportCenter mode="widget" />
        <AnbuRingCleanup />
              <AuthSessionBridge />
              <MobileLoginButton />
      </body>
    </html>
  )
}