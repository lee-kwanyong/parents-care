import Link from 'next/link'
import type { ReactNode } from 'react'

const bottomLinks = [
  { href: '/', label: '홈으로', desc: '처음 화면' },
  { href: '/parent/today', label: '오늘 안부', desc: '식사·약 확인' },
  { href: '/child/reports', label: '리포트', desc: '보호자 확인' },
  { href: '/install', label: '설치 안내', desc: '앱처럼 사용' }
]

type ParentNavigationProps = {
  children: ReactNode
  currentLabel?: string
}

export function ParentNavigation({ children }: ParentNavigationProps) {
  return (
    <div className="min-h-screen bg-[#ECFFF7] text-[#24423F]">
      {children}

      <footer className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <section className="rounded-[2rem] border border-[#D8EEE7] bg-white p-5 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="mb-4 text-xl font-black tracking-[-0.03em]">
            다른 화면으로 이동하기
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
              긴급하면 119
            </a>

            <Link
              href="/care-request"
              className="rounded-2xl bg-[#19B99A] p-5 text-center text-lg font-black text-white"
            >
              보호자에게 도움 요청
            </Link>
          </div>
        </section>
      </footer>
    </div>
  )
}

export function ParentTodayNavigation({ children }: { children: ReactNode }) {
  return <ParentNavigation currentLabel="오늘 안부 확인 화면">{children}</ParentNavigation>
}
