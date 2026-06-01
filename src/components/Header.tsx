'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const menuGroups = [
  {
    title: '부모님',
    items: [
      {
        label: '부모님 코드입력',
        href: '/parent/login',
        desc: '6자리 코드로 접속'
      },
      {
        label: '안부버튼',
        href: '/parent/today',
        desc: '식사·약·몸 상태 입력'
      },
      {
        label: '안심동의',
        href: '/parent/consent',
        desc: '공유 항목 선택'
      },
      {
        label: '홈 화면에 추가',
        href: '/install',
        desc: '앱처럼 바로 열기'
      }
    ]
  },
  {
    title: '보호자',
    items: [
      {
        label: '자녀-부모 연결',
        href: '/family-link',
        desc: '6자리 코드 만들기'
      },
      {
        label: '부모님 케어',
        href: '/child/dashboard',
        desc: '식사·약·몸 상태 확인'
      }
    ]
  },
  {
    title: '운영실',
    items: [
      {
        label: '실증 운영실',
        href: '/ops/pilot',
        desc: '응답률·확인율 관리'
      },
      {
        label: 'Risk-to-Action',
        href: '/ops/risk-action',
        desc: '위험신호 행동가이드'
      },
      {
        label: '결과 라벨링',
        href: '/ops/outcomes',
        desc: '실제 결과 기록'
      }
    ]
  }
]

export function GlobalHeader() {
  const pathname = usePathname() || '/'
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current) return
      if (!boxRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-[#D8EEE8] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#DFF7F0] text-xl">
            ♡
          </span>

          <span className="min-w-0">
            <span className="block truncate text-base font-black tracking-[-0.05em] text-[#173B36]">
              부모님 안심케어
            </span>
            <span className="block truncate text-[11px] font-bold text-[#5F7D77]">
              by 안부웍스
            </span>
          </span>
        </Link>

        <div ref={boxRef} className="relative flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full bg-[#F8FCFB] px-4 py-2 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            aria-expanded={open}
          >
            메뉴
          </button>

          <Link
            href="/login"
            className="rounded-full bg-[#193B38] px-4 py-2 text-sm font-black text-white"
          >
            로그인/회원가입
          </Link>

          {open ? (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] bg-white shadow-[0_18px_52px_rgba(20,82,70,0.18)] ring-1 ring-[#D8EEE8]">
              <div className="max-h-[70vh] overflow-y-auto p-3">
                {menuGroups.map((group) => (
                  <section key={group.title} className="py-2">
                    <div className="px-3 text-xs font-black text-[#7A9692]">
                      {group.title}
                    </div>

                    <div className="mt-2 grid gap-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8] transition hover:bg-[#EFFFF9]"
                        >
                          <div className="text-sm font-black text-[#173B36]">
                            {item.label}
                          </div>
                          <div className="mt-1 text-xs font-bold leading-5 text-[#637B76]">
                            {item.desc}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export const Header = GlobalHeader
export default GlobalHeader
