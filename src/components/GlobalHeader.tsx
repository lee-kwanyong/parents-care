'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { readParentSession } from '@/components/auth/ParentSessionBridge'

type Mode = 'guest' | 'parent'

const guestMenu = [
  {
    title: '시작',
    items: [
      { label: '홈', href: '/', desc: '처음 화면으로 이동' },
      { label: '로그인/회원가입', href: '/login', desc: '보호자 로그인 및 역할 선택' },
      { label: '홈 화면에 추가', href: '/install', desc: '앱처럼 바로 열기' }
    ]
  },
  {
    title: '부모님',
    items: [
      { label: '부모님 코드입력', href: '/parent/login', desc: '6자리 코드와 휴대폰 뒤 4자리 입력' }
    ]
  },
  {
    title: '보호자',
    items: [
      { label: '부모님 연결코드', href: '/family-link', desc: '부모님께 보낼 코드 생성' },
      { label: '부모님 리포트', href: '/child/dashboard', desc: '식사·약·몸상태 확인' }
    ]
  }
]

const parentMenu = [
  {
    title: '부모님 전용',
    items: [
      { label: '안부버튼', href: '/parent/today', desc: '식사·약·몸 상태 입력' },
      { label: '안심동의', href: '/parent/consent', desc: '공유 항목 선택' },
      { label: '코드입력', href: '/parent/login', desc: '다시 입력이 필요할 때 사용' },
      { label: '홈 화면에 추가', href: '/install', desc: '앱처럼 바로 열기' }
    ]
  }
]

export function GlobalHeader() {
  const pathname = usePathname() || '/'
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('guest')
  const boxRef = useRef<HTMLDivElement | null>(null)

  function refresh() {
    setMode(readParentSession() ? 'parent' : 'guest')
  }

  useEffect(() => {
    refresh()

    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('anbu-auth-changed', refresh)
    window.addEventListener('anbu-parent-session-changed', refresh)

    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('anbu-auth-changed', refresh)
      window.removeEventListener('anbu-parent-session-changed', refresh)
    }
  }, [])

  useEffect(() => {
    setOpen(false)
    refresh()
  }, [pathname])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current) return
      if (!boxRef.current.contains(event.target as Node)) setOpen(false)
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const isParent = mode === 'parent'
  const menu = isParent ? parentMenu : guestMenu
  const logoHref = isParent ? '/parent/today' : '/'
  const subTitle = isParent ? '부모님 연결 완료' : 'by 안부웍스'

  return (
    <header className="sticky top-0 z-50 border-b border-[#D8EEE8] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href={logoHref} className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#DFF7F0] text-xl">
            ♡
          </span>

          <span className="min-w-0">
            <span className="block truncate text-base font-black tracking-[-0.05em] text-[#173B36]">
              부모님 안심케어
            </span>
            <span className="block truncate text-[11px] font-bold text-[#5F7D77]">
              {subTitle}
            </span>
          </span>
        </Link>

        <div ref={boxRef} className="relative flex shrink-0 items-center gap-2">
          {isParent ? (
            <span className="hidden rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F] ring-1 ring-[#CDEFE5] sm:inline-flex">
              연결 완료
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full bg-[#F8FCFB] px-4 py-2 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            aria-expanded={open}
          >
            메뉴
          </button>

          {!isParent ? (
            <Link href="/login" className="rounded-full bg-[#193B38] px-4 py-2 text-sm font-black text-white">
              로그인/회원가입
            </Link>
          ) : null}

          {open ? (
            <div className="fixed inset-0 z-[100]">
              <button
                type="button"
                aria-label="메뉴 닫기"
                className="absolute inset-0 bg-[#0B1F1B]/35"
                onClick={() => setOpen(false)}
              />

              <aside
                className="absolute right-0 top-0 h-full overflow-y-auto rounded-l-[2rem] bg-white p-4 shadow-2xl ring-1 ring-[#D8EEE8]"
                style={{
                  width: 'min(360px, calc(100vw - 2rem))',
                  writingMode: 'horizontal-tb',
                  textOrientation: 'mixed'
                }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-black tracking-[-0.05em] text-[#173B36]">
                      메뉴
                    </div>
                    <div className="mt-1 text-xs font-bold text-[#7A9692]">
                      {isParent ? '부모님 전용 메뉴' : '안부웍스 메뉴'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-[#F8FCFB] px-4 py-2 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
                  >
                    닫기
                  </button>
                </div>

                <nav className="space-y-5">
                  {menu.map((group) => (
                    <section key={group.title}>
                      <div className="mb-2 px-1 text-xs font-black text-[#7A9692]">
                        {group.title}
                      </div>

                      <div className="grid gap-2">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="block w-full rounded-2xl bg-[#F8FCFB] p-4 text-left ring-1 ring-[#D8EEE8] transition hover:bg-[#EFFFF9]"
                            style={{
                              writingMode: 'horizontal-tb',
                              textOrientation: 'mixed'
                            }}
                          >
                            <div className="whitespace-normal break-keep text-base font-black leading-6 text-[#173B36]">
                              {item.label}
                            </div>
                            <div className="mt-1 whitespace-normal break-keep text-sm font-bold leading-6 text-[#637B76]">
                              {item.desc}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </nav>
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export const Header = GlobalHeader
export default GlobalHeader
