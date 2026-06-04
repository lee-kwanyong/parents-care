'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { clearParentSessionStorage, readParentSession } from '@/components/auth/ParentSessionBridge'

type Mode = 'guest' | 'parent'

type MenuItem = {
  label: string
  href?: string
  desc: string
  action?: 'parentLogout'
}

type MenuGroup = {
  title: string
  items: MenuItem[]
}

const guestMenu: MenuGroup[] = [
  {
    title: '시작',
    items: [
      { label: '홈', href: '/', desc: '처음 화면으로 이동' },
      { label: '로그인/회원가입', href: '/login', desc: '보호자 로그인 및 역할 선택' },
      { label: '보호자 회원가입', href: '/signup/guardian', desc: '이메일·Google·Kakao 계정으로 시작' },
      { label: '홈 화면에 추가', href: '/install', desc: '휴대폰 홈 화면에 앱처럼 추가' }
    ]
  },
  {
    title: '부모님',
    items: [
      { label: '부모님 코드입력', href: '/parent/login', desc: '6자리 코드와 휴대폰 뒤 4자리 입력' },
      { label: '부모님 안부버튼', href: '/parent/today', desc: '식사·약·몸 상태 입력' },
      { label: '안심동의', href: '/parent/consent', desc: '자녀에게 공유할 항목 선택' }
    ]
  },
  {
    title: '보호자·가족',
    items: [
      { label: '부모님 연결코드', href: '/family-link', desc: '부모님께 보낼 연결코드 생성' },
      { label: '다른 가족 초대', href: '/family/invite', desc: '형제·자매·배우자를 부모님 리포트에 초대' },
      { label: '지역 안심망 소개', href: '/response/about', desc: '가족·돌봄파트너·지역상점·기관 연결 구조 소개' },
      { label: '지역 도움망 요청함', href: '/provider/requests', desc: '돌봄파트너·상점·약국이 받은 요청 처리' },
      { label: '가족 초대코드 입력', href: '/family/join', desc: '초대받은 가족이 코드와 휴대폰 뒤 4자리 입력' },
      { label: '부모님 리포트', href: '/child/dashboard', desc: '식사·복약·몸상태 확인' },
      { label: '부모님 케어', href: '/child/report', desc: '자녀용 부모님 상태 리포트' },
      { label: '가족 실행 보드', href: '/family/actions', desc: '가족이 확인할 일을 나눠 맡고 완료 기록을 남깁니다' },
      { label: '안부온', href: '/child/safety-loop', desc: '안부 확인 루프' }
    ]
  },
  {
    title: '지자체·R&D',
    items: [
      { label: '지자체 실증 운영실', href: '/gov/dashboard', desc: '통합돌봄 안부 모니터링 대시보드' },
      { label: '지역 후속조치 관제', href: '/response?scope=ops', desc: '운영실 인증 후 전체 요청 관제' },
      { label: '대상자 관리', href: '/gov/recipients', desc: '실증 대상자와 담당자를 관리' },
      { label: '사례관리', href: '/gov/cases', desc: '전화 확인·방문 필요·완료 기록' },
      { label: '성과보고', href: '/gov/reports', desc: '월간 성과지표와 보고서 초안' },
      { label: 'IoT 관제 준비', href: '/gov/iot', desc: '스마트 복약통·UWB 센서 실증 구조' },
      { label: 'R&D 제안 패키지', href: '/gov/proposal', desc: '정부·지자체 과제 제안 구조' },
      { label: '지자체 제출 패키지', href: '/gov/submission', desc: '제안서·실증계획·KPI·메일 초안 생성' },
      { label: '공공 컴플라이언스', href: '/gov/compliance', desc: '개인정보·접근성 제출 증빙 기록' },
      { label: '제출 PDF 인쇄본', href: '/gov/submission/print', desc: '지자체 제출용 PDF 저장 화면' },
      { label: '제출 전 준비상태', href: '/gov/readiness', desc: 'SQL·페이지·PDF·보안·제안 준비상태 점검' },
      { label: '감사로그', href: '/gov/audit', desc: '접근·처리 기록 확인' },
      { label: 'CSV 내보내기', href: '/gov/export', desc: '대상자와 성과 데이터 다운로드' }
    ]
  },
  {
    title: '운영',
    items: [
      { label: '운영실 Admin', href: '/ops', desc: '운영실 시작 화면' },
      { label: '알림 발송센터', href: '/ops/notification-dispatch', desc: '후속조치 요청 SMS 발송·실패 재시도' },
      { label: '실증 운영실', href: '/ops/pilot', desc: '실증·응답률·확인율 관리' },
      { label: 'Risk-to-Action', href: '/ops/risk-action', desc: '위험 신호 행동가이드' },
      { label: '결과 라벨링', href: '/ops/outcomes', desc: '실제 결과 기록' },
      { label: '파트너 승인', href: '/ops/partners', desc: '케어파트너 검증' },
      { label: '배정 관리', href: '/ops/matching', desc: '부모님·보호자 매칭 관리' },
      { label: '배정 현황', href: '/ops/assignments', desc: '현재 배정 상태 확인' },
      { label: '파트너 DB', href: '/ops/partner-db', desc: '파트너 정보 관리' },
      { label: '알림 설정', href: '/ops/notifications', desc: 'SMS·앱 알림 설정' }
    ]
  }
]

const parentMenu: MenuGroup[] = [
  {
    title: '부모님 전용',
    items: [
      { label: '오늘 안부', href: '/parent/today', desc: '식사·약·몸 상태 선택' },
      { label: '식사 확인', href: '/parent/today', desc: '아침·점심·저녁 식사 확인' },
      { label: '복약 확인', href: '/parent/today', desc: '아침약·점심약·저녁약 확인' },
      { label: '몸 상태', href: '/parent/today', desc: '괜찮아요 / 몸이 불편해요' },
      { label: '도움 요청', href: '/parent/today', desc: '도움 필요 없어요 / 도움이 필요해요' },
      { label: '안심동의', href: '/parent/consent', desc: '자녀에게 공유할 항목 선택' },
      { label: '코드입력', href: '/parent/login', desc: '다시 연결이 필요할 때 사용' },
      { label: '홈 화면에 추가', href: '/install', desc: '휴대폰 홈 화면에 앱처럼 추가' }
    ]
  },
  {
    title: '연결 관리',
    items: [
      { label: '로그아웃 / 연결해제', action: 'parentLogout', desc: '이 기기에서 부모님 연결을 해제합니다' }
    ]
  }
]

function MenuPortal({
  open,
  isParent,
  onClose,
  onParentLogout
}: {
  open: boolean
  isParent: boolean
  onClose: () => void
  onParentLogout: () => void
}) {
  if (!open || typeof document === 'undefined') return null

  const menu = isParent ? parentMenu : guestMenu

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="안부웍스 메뉴"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        writingMode: 'horizontal-tb',
        textOrientation: 'mixed'
      }}
    >
      <button
        type="button"
        aria-label="메뉴 닫기"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          background: 'rgba(11, 31, 27, 0.42)',
          cursor: 'pointer'
        }}
      />

      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(420px, calc(100vw - 24px))',
          height: '100dvh',
          maxHeight: '100dvh',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#ffffff',
          borderTopLeftRadius: '2rem',
          borderBottomLeftRadius: '2rem',
          boxShadow: '0 24px 80px rgba(20, 82, 70, 0.26)',
          borderLeft: '1px solid #D8EEE8',
          padding: '18px',
          writingMode: 'horizontal-tb',
          textOrientation: 'mixed'
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-black tracking-[-0.06em] text-[#173B36]">
              메뉴
            </div>
            <div className="mt-1 text-sm font-bold text-[#7A9692]">
              {isParent ? '부모님 전용 메뉴' : '안부웍스 전체 메뉴'}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F8FCFB] px-4 py-2 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            닫기
          </button>
        </div>

        <nav className="space-y-6">
          {menu.map((group) => (
            <section key={group.title}>
              <div className="mb-2 px-1 text-xs font-black text-[#7A9692]">
                {group.title}
              </div>

              <div className="grid gap-2">
                {group.items.map((item) => {
                  if (item.action === 'parentLogout') {
                    return (
                      <button
                        key={`${group.title}-${item.label}`}
                        type="button"
                        onClick={onParentLogout}
                        className="block w-full rounded-2xl bg-[#FFF1F1] p-4 text-left text-[#8A2525] ring-1 ring-[#F3BBBB] transition hover:bg-[#FFE6E6]"
                        style={{
                          writingMode: 'horizontal-tb',
                          textOrientation: 'mixed'
                        }}
                      >
                        <div className="whitespace-normal break-keep text-base font-black leading-6">
                          {item.label}
                        </div>
                        <div className="mt-1 whitespace-normal break-keep text-sm font-bold leading-6 opacity-80">
                          {item.desc}
                        </div>
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={`${group.title}-${item.href}-${item.label}`}
                      href={item.href || '/'}
                      onClick={onClose}
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
                  )
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="h-8" />
      </aside>
    </div>
  )

  return createPortal(overlay, document.body)
}

export function GlobalHeader() {
  const pathname = usePathname() || '/'
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('guest')
  const [mounted, setMounted] = useState(false)

  function refresh() {
    setMode(readParentSession() ? 'parent' : 'guest')
  }

  useEffect(() => {
    setMounted(true)
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
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleParentLogout() {
    const ok = window.confirm(
      '부모님 연결을 해제하고 로그아웃할까요?\n\n이 기기에서는 안부 버튼을 더 이상 사용할 수 없고, 다시 사용하려면 6자리 코드와 휴대폰 뒤 4자리로 재연결해야 합니다.'
    )

    if (!ok) return

    clearParentSessionStorage()
    setOpen(false)
    setMode('guest')
    window.location.replace('/')
  }

  const isParent = mode === 'parent'
  const logoHref = isParent ? '/parent/today' : '/'
  const subTitle = isParent ? '부모님 연결 완료' : 'by 안부웍스'

  return (
    <>
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

          <div className="flex shrink-0 items-center gap-2">
            {isParent ? (
              <span className="hidden rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F] ring-1 ring-[#CDEFE5] sm:inline-flex">
                연결 완료
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full bg-[#F8FCFB] px-4 py-2 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
              aria-expanded={open}
            >
              메뉴
            </button>

            {!isParent ? (
              <Link
                href="/login"
                className="rounded-full bg-[#193B38] px-4 py-2 text-sm font-black text-white"
              >
                로그인/회원가입
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {mounted ? (
        <MenuPortal
          open={open}
          isParent={isParent}
          onClose={() => setOpen(false)}
          onParentLogout={handleParentLogout}
        />
      ) : null}
    </>
  )
}

export const Header = GlobalHeader
export default GlobalHeader
