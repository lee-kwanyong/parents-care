'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PWAInstallButton } from '@/components/PWAInstallButton'

const quickLinks = [
  { href: '/pricing', label: '요금제' },
  { href: '/login', label: '로그인' }
]

const menuLinks = [
  { href: '/', label: '홈', desc: '처음 화면' },
  { href: '/anbuon', label: '안부온', desc: 'AI 안부확인' },
  { href: '/family-link', label: '부모님 연결', desc: '자녀와 부모님 코드 연결' },
  { href: '/parent/login', label: '부모님 코드입력', desc: '부모님 안부온 접속' },
  { href: '/parent/today', label: '부모님 체크', desc: '식사·약·몸상태 버튼' },
  { href: '/child/daily-care', label: '보호자 알림', desc: '정상·주의·확인 필요' },
  { href: '/anbu-routines', label: '안부 루틴', desc: '식사·약·응답 없음 알림' },
  { href: '/child/weekly-report', label: '주간 리포트', desc: '상태 변화 자동 요약' },
  { href: '/care-partner/apply', label: '케어파트너 모집', desc: '요양보호사·동행 파트너 등록' },
  { href: '/settings/permissions', label: '앱 권한', desc: '알림·위치·접근성 설정' },
  { href: '/privacy-consent', label: '개인정보 동의', desc: '안부 정보 공유 동의' },
  { href: '/pricing', label: '요금제', desc: '구독·사람 연결 요금' }
]

const internalLinks = [
  { href: '/ops/anbu-control', label: '운영실 관제', desc: '확인 필요 신호 처리' },
  { href: '/platform-roadmap', label: '플랫폼 구조', desc: '투자자 설명 흐름' }
]

export function GlobalHeader() {
  const [open, setOpen] = useState(false)
  const showInternalLinks = process.env.NEXT_PUBLIC_SHOW_INTERNAL_LINKS === 'true'
  const visibleMenuLinks = showInternalLinks ? [...menuLinks, ...internalLinks] : menuLinks

  return (
    <header
      data-global-header="true"
      className="sticky top-0 z-[80] border-b border-[#E3F0ED] bg-white/95 shadow-[0_8px_24px_rgba(82,112,108,0.08)] backdrop-blur"
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
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

        <div className="flex shrink-0 items-center gap-2">
          <nav className="hidden items-center gap-2 sm:flex">
            <PWAInstallButton />

            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-full bg-[#F2FAF8] px-3 py-2 text-xs font-black text-[#537875] ring-1 ring-[#DDEEEA] transition hover:bg-[#E4F7F2] sm:px-4 sm:text-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full bg-[#193B38] px-3 py-2 text-xs font-black text-white shadow-[0_8px_20px_rgba(25,59,56,0.16)] transition hover:bg-[#24423F] sm:px-4 sm:text-sm"
            aria-expanded={open}
            aria-label="메뉴 열기"
          >
            {open ? '닫기' : '메뉴'}
          </button>
        </div>
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="fixed inset-0 z-[85] cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />

          <div
            id="anbu-global-menu-panel"
            data-global-menu-panel="true"
            className="fixed z-[90] overflow-hidden rounded-[1.5rem] border border-[#DCEDE7] bg-white shadow-[0_18px_48px_rgba(20,82,70,0.16)]"
          >
            <div className="border-b border-[#E7F2EF] px-4 py-3">
              <div className="text-sm font-black text-[#159B84]">안부웍스 메뉴</div>
              <div className="mt-1 text-xs font-bold text-[#7A9692]">필요한 화면으로 바로 이동하세요.</div>
            </div>

            <div className="max-h-[68vh] overflow-y-auto p-2">
              <div className="sm:hidden">
                <PWAInstallButton
                  label="홈추가"
                  className="mb-2 w-full rounded-2xl bg-[#EFFFF9] px-3 py-3 text-left text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]"
                />
              </div>

              {visibleMenuLinks.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-3 py-2.5 transition hover:bg-[#F2FAF8]"
                >
                  <div className="text-sm font-black text-[#24423F]">{item.label}</div>
                  <div className="mt-0.5 text-xs font-bold text-[#718A87]">{item.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </header>
  )
}
