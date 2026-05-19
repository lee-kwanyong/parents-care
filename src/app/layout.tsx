import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '부모님 안심케어',
  description: '부모님 안심케어를 쉽게 시작하는 부모님 케어 플랫폼',
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
  return <html lang="ko"><body>{children}</body></html>
}
