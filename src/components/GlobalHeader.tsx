'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PWAInstallButton } from '@/components/PWAInstallButton'
import { AccountMenuButton } from '@/components/auth/AccountMenuButton'

const quickLinks = [
  { href: '/landing', label: '시작' },
  { href: '/login', label: '로그인' }
]

const menuLinks = [
  { href: '/parent/consent', label: '안심동의', desc: '부모님 공유 설정' },
  { href: '/care-partner/report-guide', label: '리포트 가이드', desc: '파트너 리포트 작성 기준' },
  { href: '/child/care-reports', label: '케어 리포트', desc: '보호자 케어 결과 확인' },
  { href: '/partner/tasks', label: '파트너 업무', desc: '배정 업무·리포트 작성' },
  { href: '/care-matching', label: '케어 요청', desc: '보호자 케어파트너 요청' },
  { href: '/subscription', label: '구독 관리', desc: '체험·리포트 구독 상태' },
  { href: '/billing', label: '결제 준비', desc: '요금제 결제 의도 생성' },
  { href: '/', label: '홈', desc: '처음 화면' },
  { href: '/landing', label: '서비스 소개', desc: '부모님 안심케어 소개' },
  { href: '/onboarding', label: '보호자 시작', desc: '처음 설정 마법사' },
  { href: '/family-link', label: '부모님 연결', desc: '자녀와 부모님 코드 연결' },
  { href: '/parent/login', label: '부모님 코드입력', desc: '부모님 안부온 접속' },
  { href: '/parent/today', label: '부모님 체크', desc: '식사·약·몸상태 버튼' },
  { href: '/child/dashboard', label: '보호자 대시보드', desc: '오늘 부모님 상태' },
  { href: '/care-schedule', label: '복약·병원 일정', desc: '약과 병원 예약 관리' },
  { href: '/child/weekly-report', label: '주간 리포트', desc: '상태 변화 자동 요약' },
  { href: '/partners', label: '협업기관 안내', desc: '교육원·센터 협업 소개' },
  { href: '/care-partner/apply', label: '케어파트너 신청', desc: '요양보호사·동행 파트너' },
  { href: '/care-partner/guide', label: '파트너 교육', desc: '활동 기준과 리포트 작성' },
  { href: '/safety-protocol', label: '안전 프로토콜', desc: '도움 필요 신호 대응' },
  { href: '/settings/permissions', label: '앱 권한', desc: '알림·위치·접근성 설정' },
  { href: '/privacy-consent', label: '개인정보 동의', desc: '안부 정보 공유 동의' },
  { href: '/contact', label: '문의하기', desc: '보호자·파트너·협업 문의' },
  { href: '/data-deletion', label: '데이터 삭제', desc: '계정·기록 삭제 요청' },
  { href: '/privacy', label: '개인정보처리방침', desc: '개인정보 보호 안내' },
  { href: '/terms', label: '이용약관', desc: '서비스 이용 기준' },
  { href: '/health-disclaimer', label: '건강정보 고지', desc: '의료 진단 아님 안내' }
]

const internalLinks = [
  { href: '/ops/pilot', label: '실증 운영실', desc: 'Pilot Evidence OS' },
  { href: '/ops/risk-action', label: 'Risk-to-Action', desc: '위험신호 행동가이드' },
  { href: '/ops/anbu-graph', label: 'AnbuGraph', desc: '가족 돌봄 그래프' },
  { href: '/ops/escalation', label: '무응답 관리', desc: '3단계 확인 프로토콜' },
  { href: '/ops/audit', label: '감사 로그', desc: '운영실 접근·작업 기록' },
  { href: '/ops/dashboard', label: '운영실 홈', desc: '전체 운영 현황' },
  { href: '/ops/care-reports-review', label: '리포트 검수', desc: '보호자 공개 전 검수' },
  { href: '/ops/care-requests', label: '케어 요청 운영', desc: '요청·배정·리포트 추적' },
  { href: '/ops/partners', label: '파트너 운영', desc: '신청자 승인·매칭 관리' },
  { href: '/ops/subscriptions', label: '구독 운영', desc: '결제·체험 구독 관리' },
  { href: '/ops/kakao-templates', label: '알림톡 템플릿', desc: '카카오 알림톡 심사 문구' },
  { href: '/ops/automation', label: '자동 알림', desc: '응답 없음·일정 SMS 자동화' },
  { href: '/ops/outbox', label: '알림 발송함', desc: '대기 알림 조회·발송' },
  { href: '/ops/integrations', label: '외부연동', desc: 'SMS·카카오·결제 설정' },
  { href: '/ops/crm', label: '운영실 CRM', desc: '접수·처리 로그' },
  { href: '/ops/outreach-crm', label: '협업기관 CRM', desc: '메일 발송·회신 관리' },
  { href: '/ops/metrics', label: '핵심 지표', desc: '성장·운영 지표' },
  { href: '/play-store-ready', label: '스토어 준비', desc: 'Play Store 체크리스트' },
  { href: '/platform-roadmap', label: '플랫폼 구조', desc: '투자자 설명 흐름' },
  { href: '/location-terms', label: '위치정보 약관', desc: '위치정보 이용 안내' }
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

          <AccountMenuButton />
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