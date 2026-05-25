import type { Metadata, Viewport } from 'next'
import './globals.css'


import { GlobalHeader } from '@/components/GlobalHeader'
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
  themeColor: '#2d72d9',
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <GlobalHeader />
        {children}
      </body>
    </html>
  )
}
