'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Mode = 'guest' | 'parent'

type MenuItem = {
  label: string
  href?: string
  desc: string
  badge?: string
  tone?: 'default' | 'primary' | 'danger'
  action?: 'parentLogout'
}

type MenuGroup = {
  title: string
  items: MenuItem[]
}

function code6(value: string | null | undefined) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 6)
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`
}

function hasParentSession() {
  if (typeof window === 'undefined') return false

  const verified =
    window.localStorage.getItem('anbu_parent_verified') === 'true' ||
    getCookie('anbu_parent_verified') === 'true'

  if (!verified) return false

  const raw =
    window.localStorage.getItem('anbu_parent_session') ||
    window.localStorage.getItem('parents_care_parent_session') ||
    getCookie('anbu_parent_session')

  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      const familyCode = code6(parsed.familyCode)

      if (/^\d{6}$/.test(familyCode)) return true
    } catch {
      // ignore
    }
  }

  const keys = [
    'anbu_family_code',
    'pc_parent_invite_code',
    'anbu_parent_code',
    'parent_family_code',
    'parent_invite_code',
    'parent_link_code'
  ]

  for (const key of keys) {
    const familyCode = code6(window.localStorage.getItem(key) || getCookie(key))
    if (/^\d{6}$/.test(familyCode)) return true
  }

  return false
}

function clearParentSessionStorage() {
  if (typeof window === 'undefined') return

  const keys = [
    'anbu_family_code',
    'pc_parent_invite_code',
    'anbu_parent_code',
    'parent_family_code',
    'parent_invite_code',
    'parent_link_code',
    'anbu_login_role',
    'anbu_auth_state',
    'anbu_parent_logged_in',
    'anbu_parent_connected',
    'anbu_parent_verified',
    'anbu_parent_session',
    'parents_care_parent_session'
  ]

  for (const key of keys) {
    window.localStorage.removeItem(key)
    clearCookie(key)
  }

  for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
    const key = window.localStorage.key(i) || ''
    if (key.startsWith('anbu_today_choices_')) {
      window.localStorage.removeItem(key)
    }
  }

  window.dispatchEvent(new CustomEvent('anbu-parent-session-changed'))
  window.dispatchEvent(new CustomEvent('anbu-auth-changed'))
}

const guestQuick: MenuItem[] = [
  {
    label: '로그인',
    href: '/login',
    desc: '보호자가 가입하고 부모님 6자리 코드를 만듭니다.',
    badge: '시작',
    tone: 'primary'
  },
  {
    label: '부모님 6자리 접속',
    href: '/parent/login',
    desc: '부모님은 회원가입 없이 6자리 코드와 휴대폰 뒤 4자리를 입력합니다.',
    badge: '부모님'
  },
  {
    label: '부모님 연결코드',
    href: '/family-link',
    desc: '보호자가 부모님 휴대폰으로 보낼 연결코드를 만듭니다.',
    badge: '보호자'
  },
  {
    label: '부모님 리포트',
    href: '/child/dashboard',
    desc: '식사·약·몸 상태를 데이터 리포트로 확인합니다.',
    badge: '자녀'
  }
]

const guestGroups: MenuGroup[] = [
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
      { label: '가족 실행 보드', href: '/family/actions', desc: '가족이 확인할 일을 나눠 맡고 완료 기록을 남깁니다' },
      { label: '가족 초대코드 입력', href: '/family/join', desc: '초대받은 가족이 코드와 휴대폰 뒤 4자리 입력' },
      { label: '부모님 리포트', href: '/child/dashboard', desc: '부모님 상태 리포트 확인' },
      { label: '부모님 케어', href: '/child/report', desc: '자녀용 부모님 상태 리포트' },
      { label: '안부온', href: '/child/safety-loop', desc: '안부 확인 루프' }
    ]
  },
  {
    title: '운영',
    items: [
      { label: '운영실 Admin', href: '/ops', desc: '운영실 시작 화면' },
      { label: '자동 에스컬레이션', href: '/ops/response-escalation', desc: '미수락·미완료 요청 자동 재알림' },
      { label: '알림 발송센터', href: '/ops/notification-dispatch', desc: '후속조치 요청 SMS 발송·실패 재시도' },
      { label: '지역 후속조치 관제', href: '/response?scope=ops', desc: '운영실 인증 후 전체 요청 관제' },
      { label: '지자체 실증 운영실', href: '/gov/dashboard', desc: '통합돌봄 안부 모니터링 대시보드' },
      { label: '제출 전 준비상태', href: '/gov/readiness', desc: 'SQL·페이지·PDF·보안·제안 준비상태 점검' },
      { label: '공공 컴플라이언스', href: '/gov/compliance', desc: '개인정보·접근성 제출 증빙 기록' },
      { label: '지자체 제출 패키지', href: '/gov/submission', desc: '제안서·실증계획·KPI·메일 초안 생성' },
      { label: '제출 PDF 인쇄본', href: '/gov/submission/print', desc: '지자체 제출용 PDF 저장 화면' },
      { label: 'IoT 관제 준비', href: '/gov/iot', desc: '스마트 복약통·UWB 센서 실증 구조' },
      { label: '대상자 관리', href: '/gov/recipients', desc: '실증 대상자와 담당자를 관리' },
      { label: '사례관리', href: '/gov/cases', desc: '전화 확인·방문 필요·완료 기록' },
      { label: '성과보고', href: '/gov/reports', desc: '월간 성과지표와 보고서 초안' },
      { label: 'R&D 제안 패키지', href: '/gov/proposal', desc: '정부·지자체 과제 제안 구조' },
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

const parentQuick: MenuItem[] = [
  {
    label: '오늘 안부',
    href: '/parent/today',
    desc: '식사·약·몸 상태를 자녀에게 알려주세요.',
    badge: '부모님',
    tone: 'primary'
  },
  {
    label: '안심동의',
    href: '/parent/consent',
    desc: '자녀에게 공유할 항목을 선택합니다.',
    badge: '동의'
  },
  {
    label: '홈 화면에 추가',
    href: '/install',
    desc: '휴대폰 홈 화면에 앱처럼 추가합니다.',
    badge: '앱'
  },
  {
    label: '로그아웃 / 연결해제',
    action: 'parentLogout',
    desc: '이 기기에서 부모님 연결을 해제합니다.',
    badge: '연결관리',
    tone: 'danger'
  }
]

const parentGroups: MenuGroup[] = [
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
      { label: '로그아웃 / 연결해제', action: 'parentLogout', desc: '이 기기에서 부모님 연결을 해제합니다.', tone: 'danger' }
    ]
  }
]

function itemClass(tone?: MenuItem['tone']) {
  if (tone === 'danger') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (tone === 'primary') return 'bg-[#123F38] text-white ring-[#123F38]'
  return 'bg-white text-[#173B36] ring-[#D8EEE8]'
}

export function MenuPageContent() {
  const [mode, setMode] = useState<Mode>('guest')

  useEffect(() => {
    setMode(hasParentSession() ? 'parent' : 'guest')

    function refresh() {
      setMode(hasParentSession() ? 'parent' : 'guest')
    }

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

  function handleParentLogout() {
    const ok = window.confirm(
      '부모님 연결을 해제하고 로그아웃할까요?\n\n다시 사용하려면 6자리 코드와 휴대폰 뒤 4자리로 재연결해야 합니다.'
    )

    if (!ok) return

    clearParentSessionStorage()
    setMode('guest')
    window.location.href = '/'
  }

  const isParent = mode === 'parent'
  const quickItems = isParent ? parentQuick : guestQuick
  const groups = isParent ? parentGroups : guestGroups

  function renderItem(item: MenuItem, large = false) {
    const content = (
      <>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E8FAF5] text-2xl">
            {item.tone === 'danger' ? '↩︎' : '♡'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className={large ? 'text-2xl font-black tracking-[-0.06em]' : 'text-lg font-black tracking-[-0.04em]'}>
                {item.label}
              </div>

              {item.badge ? (
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-[#116D5F] ring-1 ring-[#D8EEE8]">
                  {item.badge}
                </span>
              ) : null}
            </div>

            <p className="mt-2 break-keep text-sm font-bold leading-7 opacity-75">
              {item.desc}
            </p>
          </div>
        </div>
      </>
    )

    if (item.action === 'parentLogout') {
      return (
        <button
          key={item.label}
          type="button"
          onClick={handleParentLogout}
          className={'block w-full rounded-[2rem] p-5 text-left shadow-sm ring-1 ' + itemClass(item.tone)}
        >
          {content}
        </button>
      )
    }

    return (
      <Link
        key={`${item.href}-${item.label}`}
        href={item.href || '/'}
        className={'block rounded-[2rem] p-5 shadow-sm ring-1 transition hover:translate-y-[-1px] ' + itemClass(item.tone)}
      >
        {content}
      </Link>
    )
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-5xl space-y-8">
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.08em] text-[#173B36]">
                자주 쓰는 메뉴
              </h1>
              <p className="mt-2 text-sm font-bold text-[#637B76]">
                필요한 화면으로 바로 이동하세요.
              </p>
            </div>

            <span className="hidden rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F] sm:inline-flex">
              {isParent ? '부모님 전용' : '전체 메뉴'}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {quickItems.map((item) => renderItem(item, true))}
          </div>
        </section>

        <section className="space-y-6">
          {groups.map((group) => (
            <section key={group.title} className="space-y-3">
              <h2 className="text-2xl font-black tracking-[-0.06em] text-[#173B36]">
                {group.title}
              </h2>

              <div className="grid gap-3 md:grid-cols-2">
                {group.items.map((item) => renderItem(item))}
              </div>
            </section>
          ))}
        </section>
      </section>
    </main>
  )
}

export default MenuPageContent
