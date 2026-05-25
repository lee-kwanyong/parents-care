'use client'

import Link from 'next/link'
import { useState } from 'react'

const primaryLinks = [
  { href: '/anbuon', label: '안부온' },
  { href: '/care-request', label: '안심케어 시작' },
  { href: '/care-intake', label: '사진·카톡 접수' },
  { href: '/child', label: '자녀앱' },
  { href: '/parent/today', label: '부모님앱' },
  { href: '/install', label: '홈추가' }
]

const fixedMenuLinks = [
  { href: '/child/daily-care', label: '보호자 알림', desc: '정상/주의/확인 필요' },
  { href: '/child/daily-care/report', label: '주간 리포트', desc: '부모님 상태 변화 요약' },
  { href: '/pilot/cheongju', label: '청주 실증', desc: '지역 테스트 관리' },
  { href: '/care-costs', label: '금액', desc: '비용과 승인 흐름' },
  { href: '/care-difference', label: '신뢰기준', desc: '검증·리포트·운영 기준' },
  { href: '/ops', label: '운영실', desc: '접수·매칭·알림 관리' },
  { href: '/login', label: '로그인', desc: '보호자·운영실 접속' }
]

export function GlobalHeader() {
  const [open, setOpen] = useState(false)
  const showInternalLinks = process.env.NEXT_PUBLIC_SHOW_INTERNAL_LINKS === 'true'

  const menuLinks = showInternalLinks
    ? fixedMenuLinks
    : fixedMenuLinks.filter((item) => item.href !== '/ops')

  return (
    <header className="sticky top-0 z-[80] border-b border-[#E3F0ED] bg-white/95 shadow-[0_8px_24px_rgba(82,112,108,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DCF8F1] text-2xl text-[#159B84]">
            ♡
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-black tracking-[-0.03em] text-[#24423F] sm:text-lg">
              부모님 안심케어
            </div>
            <div className="truncate text-xs font-bold text-[#6F8D89]">
              by 안부웍스 · AI 안부확인
            </div>
          </div>
        </Link>

        <nav className="hidden flex-wrap items-center justify-end gap-2 lg:flex">
          {primaryLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full bg-[#F2FAF8] px-4 py-2 text-sm font-black text-[#537875] ring-1 ring-[#DDEEEA] transition hover:bg-[#E4F7F2]"
            >
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="shrink-0 rounded-full bg-[#193B38] px-4 py-2 text-sm font-black text-white shadow-[0_8px_20px_rgba(25,59,56,0.16)] transition hover:bg-[#24423F]"
            aria-expanded={open}
          >
            메뉴
          </button>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="shrink-0 rounded-full bg-[#193B38] px-4 py-2 text-sm font-black text-white shadow-[0_8px_20px_rgba(25,59,56,0.16)] lg:hidden"
          aria-expanded={open}
        >
          {open ? '닫기' : '메뉴'}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#E3F0ED] bg-white">
          <div className="mx-auto grid max-w-7xl gap-2 px-4 py-3 sm:px-5 md:grid-cols-2 lg:grid-cols-4">
            {primaryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-[#F6FCFA] p-4 ring-1 ring-[#E3EFEC] transition hover:bg-[#EAFBF6]"
              >
                <div className="text-base font-black text-[#24423F]">{item.label}</div>
                <div className="mt-1 text-xs font-bold text-[#718A87]">바로 이동</div>
              </Link>
            ))}

            {menuLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-white p-4 ring-1 ring-[#E3EFEC] transition hover:bg-[#F6FCFA]"
              >
                <div className="text-base font-black text-[#24423F]">{item.label}</div>
                <div className="mt-1 text-xs font-bold text-[#718A87]">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  )
}
