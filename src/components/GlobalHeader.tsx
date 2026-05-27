'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PWAInstallButton } from './PWAInstallButton'

const outsideLinks = [
  { href: '/pricing', label: '요금', fullLabel: '요금제' },
  { href: '/login', label: '로그인', fullLabel: '로그인' }
]

const menuSections = [
  {
    title: '시작',
    items: [
      { href: '/', label: '홈' },
      { href: '/anbuon', label: '안부온' },
      { href: '/family-link', label: '부모님 연결' },
      { href: '/parent/login', label: '부모님 코드입력' },
      { href: '/parent/today', label: '부모님 체크' }
    ]
  },
  {
    title: '보호자',
    items: [
      { href: '/child/daily-care', label: '보호자 알림' },
      { href: '/child/weekly-report', label: '주간 리포트' },
      { href: '/child/assignments', label: '배정 현황' },
      { href: '/billing', label: '결제내역' }
    ]
  },
  {
    title: '케어',
    items: [
      { href: '/care-request', label: '걱정접수' },
      { href: '/care-intake', label: '사진·카톡 접수' },
      { href: '/anbu-routines', label: '안부 루틴' },
      { href: '/child/matching', label: '케어파트너' },
      { href: '/care-partner/apply', label: '파트너 신청' }
    ]
  },
  {
    title: '운영/설정',
    items: [
      { href: '/ops/anbu-control', label: '운영실 관제' },
      { href: '/ops/partners', label: '파트너 승인' },
      { href: '/ops/assignments', label: '배정 관리' },
      { href: '/setup/supabase', label: 'DB 설정' },
      { href: '/setup/notifications', label: '알림 설정' },
      { href: '/setup/partners', label: '파트너 DB' },
      { href: '/setup/payments', label: '결제 설정' },
      { href: '/settings/permissions', label: '앱 권한' },
      { href: '/privacy-consent', label: '개인정보 동의' },
      { href: '/platform-roadmap', label: '플랫폼 구조' }
    ]
  }
]

export function GlobalHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header
      data-global-header="true"
      className="sticky top-0 z-[80] border-b border-[#E3F0ED] bg-white/95 shadow-[0_8px_24px_rgba(82,112,108,0.08)] backdrop-blur"
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-5">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#DCF8F1] text-xl text-[#159B84] sm:h-11 sm:w-11 sm:text-2xl">
            ♡
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-black tracking-[-0.03em] text-[#24423F] sm:text-lg">
              부모님 안심케어
            </div>
            <div className="truncate text-[10px] font-bold text-[#6F8D89] sm:text-xs">
              by 안부웍스 · AI 안부확인
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {outsideLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={
                item.href === '/login'
                  ? 'rounded-full bg-[#193B38] px-3 py-2 text-xs font-black text-white shadow-[0_8px_20px_rgba(25,59,56,0.16)] transition hover:bg-[#24423F] sm:px-4 sm:text-sm'
                  : 'rounded-full bg-[#EFFFF9] px-3 py-2 text-xs font-black text-[#116D5F] ring-1 ring-[#CDEFE5] transition hover:bg-[#DDF8EF] sm:px-4 sm:text-sm'
              }
            >
              <span className="sm:hidden">{item.label}</span>
              <span className="hidden sm:inline">{item.fullLabel}</span>
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#24423F] ring-1 ring-[#DDEEEA] transition hover:bg-[#F2FAF8] sm:px-4 sm:text-sm"
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
            className="fixed inset-0 z-[85] cursor-default bg-black/5"
            onClick={() => setOpen(false)}
          />

          <div
            data-global-menu-panel="true"
            className="fixed left-3 right-3 top-[5.35rem] z-[90] max-h-[calc(100dvh-6.25rem)] overflow-y-auto rounded-[1.5rem] border border-[#DCEDE7] bg-white shadow-[0_18px_48px_rgba(20,82,70,0.18)] sm:left-auto sm:right-5 sm:top-[5.1rem] sm:w-[26rem]"
          >
            <div className="sticky top-0 z-10 border-b border-[#E7F2EF] bg-white/95 px-4 py-3 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-[#159B84]">
                    안부웍스 메뉴
                  </div>
                  <div className="mt-0.5 text-[11px] font-bold text-[#7A9692]">
                    요금제와 로그인은 상단에서 바로 이동합니다.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#F2FAF8] px-3 py-1.5 text-xs font-black text-[#24423F] ring-1 ring-[#DDEEEA]"
                >
                  닫기
                </button>
              </div>
            </div>

            <div className="p-3">
              <div className="mb-3">
                <PWAInstallButton guideOnly label="홈추가" />
              </div>

              <div className="grid gap-3">
                {menuSections.map((section) => (
                  <section key={section.title}>
                    <div className="mb-1.5 px-1 text-[11px] font-black text-[#159B84]">
                      {section.title}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {section.items.map((item) => (
                        <Link
                          key={`${section.title}-${item.href}-${item.label}`}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="rounded-xl bg-[#F8FCFB] px-3 py-2 text-[13px] font-black leading-snug text-[#24423F] ring-1 ring-[#E3EFEC] transition hover:bg-[#EAFBF6] sm:text-sm"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  )
}
