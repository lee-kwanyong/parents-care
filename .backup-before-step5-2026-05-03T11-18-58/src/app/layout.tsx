import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '부모님 케어 플랫폼',
  description: '부모님 걱정을 쉽게 맡기는 부모님 케어 플랫폼',
  manifest: '/manifest.webmanifest'
}

export const viewport: Viewport = {
  themeColor: '#2d72d9',
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>
}
