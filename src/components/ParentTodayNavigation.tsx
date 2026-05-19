import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'

const topLinks = [
  { href: '/', label: '홈' },
  { href: '/parent/today', label: '오늘 안심' },
  { href: '/child/reports', label: '보호자 확인' },
  { href: '/care-request', label: '안심케어 요청' },
  { href: '/parent/install', label: '앱 설치' }
]

const bottomLinks = [
  { href: '/', label: '홈으로', desc: '처음 화면' },
  { href: '/parent/today', label: '오늘 안심', desc: '오시는 분 확인' },
  { href: '/child/reports', label: '보호자 확인', desc: '자녀가 보는 리포트' },
  { href: '/parent/install', label: '설치 안내', desc: '앱처럼 사용' }
]

type ParentNavigationProps = {
  children: ReactNode
  currentLabel?: string
}

export function ParentNavigation({ children, currentLabel = '부모님 안심 화면' }: ParentNavigationProps) {
  return (
    <div className="min-h-screen bg-[#ECFFF7] text-[#24423F]">
      <header className="sticky top-0 z-40 border-b border-[#D8EEE7] bg-white/95 px-4 py-3 shadow-[0_10px_30px_rgba(93,139,131,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <BrandLogo title="부모님 안심케어" subtitle={currentLabel} compact />

          <nav aria-label="부모님 안심 화면 이동" className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {topLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 rounded-full bg-[#F4FAF9] px-4 py-3 text-sm font-black text-[#426C68] ring-1 ring-[#DDEDE9] transition hover:bg-[#EAFBF6]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {children}

      <footer className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <section className="rounded-[2rem] border border-[#D8EEE7] bg-white p-5 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="mb-4 text-xl font-black tracking-[-0.03em]">
            필요한 화면으로 이동하기
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {bottomLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl bg-[#F6FCFA] p-5 text-center ring-1 ring-[#E3EFEC] transition hover:bg-[#EAFBF6]"
              >
                <div className="text-lg font-black">{link.label}</div>
                <div className="mt-1 text-sm font-bold text-[#718A87]">{link.desc}</div>
              </Link>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <a
              href="tel:119"
              className="rounded-2xl bg-[#FFE9EB] p-5 text-center text-lg font-black text-[#965D65] ring-1 ring-[#F2C9CE]"
            >
              긴급할 땐 119
            </a>

            <Link
              href="/care-request"
              className="rounded-2xl bg-[#19B99A] p-5 text-center text-lg font-black text-white"
            >
              보호자에게 안심케어 요청
            </Link>
          </div>

          <p className="mt-4 text-center text-xs font-bold leading-5 text-[#8AA29E]">
            이 화면은 부모님이 보기 쉽게 큰 글씨와 큰 버튼으로 만들었습니다.
          </p>
        </section>
      </footer>
    </div>
  )
}

export function ParentTodayNavigation({ children }: { children: ReactNode }) {
  return <ParentNavigation currentLabel="오늘 안심 확인 화면">{children}</ParentNavigation>
}
