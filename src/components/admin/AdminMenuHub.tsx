'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  getAdminMenuLinks,
  getMenuLinksForRole,
  roleMeta,
  type MenuLink,
  type PortalRole
} from '@/lib/adminMenuRegistry'

export type AdminMenuHubProps = {
  role?: PortalRole
  title?: string
  subtitle?: string
  debugMode?: boolean
  showAdminOnly?: boolean
  embedded?: boolean
  compact?: boolean
  hideHeader?: boolean
  className?: string
  [key: string]: unknown
}

type AdminCategory = {
  key: string
  label: string
  desc: string
  badge: string
  tone: string
  ring: string
}

const adminCategories: AdminCategory[] = [
  {
    key: '운영',
    label: '운영',
    desc: '오늘 처리할 실증, 가입자, 리포트, 미응답 관리',
    badge: 'OPS',
    tone: 'bg-[#EFFFFA] text-[#247A71]',
    ring: 'ring-[#CDEFE7]'
  },
  {
    key: '스마트링·R&D',
    label: '스마트링·R&D',
    desc: '링 데이터, CSV, 리포트 실험실, 센서 검증',
    badge: 'RING',
    tone: 'bg-[#F6F4FF] text-[#4A3A8A]',
    ring: 'ring-[#DED8FF]'
  },
  {
    key: '지자체·R&D',
    label: '지자체·R&D',
    desc: 'B2G, 조달, 제안서, 책임범위, 공공 실증',
    badge: 'B2G',
    tone: 'bg-[#FFF9EE] text-[#795C22]',
    ring: 'ring-[#F3DEB5]'
  },
  {
    key: '문자·알림',
    label: '문자·알림',
    desc: '상황별 문자, 알림 발송, 비용 보호, 실패 관리',
    badge: 'SMS',
    tone: 'bg-[#FFF4F4] text-[#8A3030]',
    ring: 'ring-[#F3C8C8]'
  },
  {
    key: '시스템',
    label: '시스템',
    desc: '배포 전 점검, 인증, 설정, 테스트',
    badge: 'SYS',
    tone: 'bg-white text-[#17443F]',
    ring: 'ring-[#D6EDE7]'
  }
]

const categoryOrder = [
  '운영',
  '스마트링·R&D',
  '지자체·R&D',
  '문자·알림',
  '시스템',
  '공통',
  '부모님',
  '보호자',
  '가이드'
]

const priorityHrefHints = [
  '/today-runbook',
  '/pilot-report',
  '/private-pilot',
  '/users',
  '/ring-report-lab',
  '/ring-csv-import',
  '/gov-rnd',
  '/message-automation',
  '/notification-dispatch',
  '/preflight-test'
]

function normalizeRole(role?: PortalRole): PortalRole {
  if (role === 'careWorker') return 'care-worker'
  return role || 'all'
}

function groupByCategory(links: MenuLink[]) {
  return links.reduce<Record<string, MenuLink[]>>((acc, link) => {
    const category = link.category || '기타'
    acc[category] = acc[category] || []
    acc[category].push(link)
    return acc
  }, {})
}

function findCategory(category: string) {
  return (
    adminCategories.find((item) => item.key === category) || {
      key: category,
      label: category,
      desc: '관리 메뉴',
      badge: 'MENU',
      tone: 'bg-white text-[#17443F]',
      ring: 'ring-[#D6EDE7]'
    }
  )
}

function scoreLink(link: MenuLink) {
  const hrefScore = priorityHrefHints.findIndex((hint) => link.href.includes(hint))
  const base = hrefScore >= 0 ? hrefScore : 100
  return base + (link.priority || 999) / 1000
}

function searchTarget(link: MenuLink) {
  return `${link.title} ${link.description} ${link.category} ${link.badge || ''} ${link.href}`.toLowerCase()
}

function isAdminMode(role: PortalRole, showAdminOnly?: boolean) {
  return showAdminOnly || role === 'admin' || role === 'ops'
}

function AdminPill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${className || 'bg-white text-[#17443F] ring-[#D6EDE7]'}`}>
      {children}
    </span>
  )
}

export function AdminMenuHub({
  role = 'all',
  title,
  subtitle,
  debugMode = false,
  showAdminOnly = false,
  embedded = false,
  hideHeader = false,
  className = ''
}: AdminMenuHubProps) {
  const normalizedRole = normalizeRole(role)
  const meta = roleMeta[normalizedRole] || roleMeta.all
  const adminMode = isAdminMode(normalizedRole, showAdminOnly)

  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('전체')

  const sourceLinks = useMemo(() => {
    if (adminMode) return getAdminMenuLinks()
    return getMenuLinksForRole(normalizedRole, debugMode)
  }, [adminMode, normalizedRole, debugMode])

  const categories = useMemo(() => {
    const found = Array.from(new Set(sourceLinks.map((link) => link.category || '기타')))
    return [
      ...categoryOrder.filter((item) => found.includes(item)),
      ...found.filter((item) => !categoryOrder.includes(item))
    ]
  }, [sourceLinks])

  const filteredLinks = useMemo(() => {
    const trimmed = query.trim().toLowerCase()

    return sourceLinks
      .filter((link) => selectedCategory === '전체' || link.category === selectedCategory)
      .filter((link) => !trimmed || searchTarget(link).includes(trimmed))
      .sort((a, b) => scoreLink(a) - scoreLink(b))
  }, [sourceLinks, selectedCategory, query])

  const grouped = useMemo(() => groupByCategory(filteredLinks), [filteredLinks])

  const focusLinks = useMemo(() => {
    return sourceLinks
      .slice()
      .sort((a, b) => scoreLink(a) - scoreLink(b))
      .slice(0, 5)
  }, [sourceLinks])

  const statusCards = useMemo(() => {
    return adminCategories.map((category) => {
      const count = sourceLinks.filter((link) => link.category === category.key).length
      return {
        ...category,
        count
      }
    })
  }, [sourceLinks])

  const pageTitle =
    title ||
    (adminMode
      ? 'Admin 운영실'
      : meta.title)

  const pageSubtitle =
    subtitle ||
    (adminMode
      ? '운영, 스마트링·R&D, 지자체·R&D, 문자·알림을 한눈에 보고 바로 처리합니다.'
      : meta.description)

  const content = (
    <section className={`mx-auto max-w-7xl space-y-6 ${className}`}>
      {!hideHeader ? (
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <AdminPill className="bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]">
                  {adminMode ? 'Admin Mission Control' : meta.shortTitle}
                </AdminPill>
                <AdminPill>고객 메뉴와 분리</AdminPill>
                <AdminPill>관리자 전용</AdminPill>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                {pageTitle}
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                {pageSubtitle}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/ops/today-runbook" className="rounded-2xl bg-[#247A71] p-4 text-white shadow-[0_14px_30px_rgba(36,122,113,0.18)]">
                  <div className="text-xs font-black opacity-75">오늘 먼저</div>
                  <div className="mt-2 text-lg font-black">운영 체크</div>
                </Link>

                <Link href="/admin/ops/ring-report-lab" className="rounded-2xl bg-[#F6F4FF] p-4 text-[#4A3A8A] ring-1 ring-[#DED8FF]">
                  <div className="text-xs font-black opacity-75">스마트링</div>
                  <div className="mt-2 text-lg font-black">리포트 실험</div>
                </Link>

                <Link href="/admin/ops/gov-rnd" className="rounded-2xl bg-[#FFF9EE] p-4 text-[#795C22] ring-1 ring-[#F3DEB5]">
                  <div className="text-xs font-black opacity-75">B2G</div>
                  <div className="mt-2 text-lg font-black">지자체·R&D</div>
                </Link>

                <Link href="/admin/ops/notification-dispatch" className="rounded-2xl bg-[#FFF4F4] p-4 text-[#8A3030] ring-1 ring-[#F3C8C8]">
                  <div className="text-xs font-black opacity-75">문자·알림</div>
                  <div className="mt-2 text-lg font-black">발송 확인</div>
                </Link>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#EFFFFA_0%,#F7FFFC_48%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className="rounded-[2rem] bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                <div className="text-sm font-black text-[#637B76]">관리 영역</div>
                <div className="mt-3 grid gap-3">
                  {statusCards.map((card) => (
                    <button
                      key={card.key}
                      onClick={() => setSelectedCategory(card.key)}
                      className={`rounded-2xl p-4 text-left ring-1 ${card.tone} ${card.ring} ${selectedCategory === card.key ? 'shadow-[0_14px_30px_rgba(49,151,136,0.12)]' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-base font-black">{card.label}</div>
                          <div className="mt-1 text-xs font-bold opacity-70">{card.desc}</div>
                        </div>
                        <div className="text-3xl font-black tracking-[-0.08em]">{card.count}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      <section className="sticky top-3 z-20 rounded-[2rem] bg-white/90 p-4 shadow-[0_14px_40px_rgba(23,68,63,0.08)] ring-1 ring-[#D6EDE7] backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="block">
            <span className="sr-only">관리 메뉴 검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="메뉴 검색: 리포트, 문자, 스마트링, 지자체, 가입자..."
              className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {['전체', ...categories].map((category) => {
              const active = selectedCategory === category
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={
                    active
                      ? 'rounded-2xl bg-[#247A71] px-4 py-3 text-xs font-black text-white'
                      : 'rounded-2xl bg-[#FAFFFD] px-4 py-3 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]'
                  }
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {adminMode ? (
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <AdminPill className="bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]">
                Quick Actions
              </AdminPill>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">자주 쓰는 메뉴</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                실증 중 가장 자주 확인하는 메뉴를 먼저 배치했습니다.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {focusLinks.map((link) => {
              const category = findCategory(link.category)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl p-5 ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(49,151,136,0.08)] ${category.tone} ${category.ring}`}
                >
                  <div className="text-xs font-black opacity-70">{link.badge || category.badge}</div>
                  <div className="mt-3 text-xl font-black tracking-[-0.05em]">{link.title}</div>
                  <div className="mt-3 text-xs font-bold leading-6 opacity-75">{link.description}</div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {filteredLinks.length === 0 ? (
        <section className="rounded-[2rem] bg-white/95 p-8 text-center shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="text-2xl font-black">검색 결과가 없습니다.</div>
          <p className="mt-3 text-sm font-bold text-[#637B76]">다른 검색어를 입력하거나 전체 카테고리를 선택하세요.</p>
        </section>
      ) : null}

      {categories
        .filter((category) => grouped[category]?.length)
        .map((category) => {
          const info = findCategory(category)
          return (
            <section
              key={category}
              className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <AdminPill className={`${info.tone} ${info.ring}`}>
                    {info.badge}
                  </AdminPill>
                  <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
                    {info.label}
                  </h2>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                    {info.desc}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAFFFD] px-4 py-3 text-sm font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                  {grouped[category].length}개 메뉴
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {grouped[category]
                  .slice()
                  .sort((a, b) => (a.priority || 999) - (b.priority || 999))
                  .map((link: MenuLink) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_rgba(49,151,136,0.08)]"
                    >
                      <div className="flex flex-wrap gap-2">
                        <AdminPill>{link.badge || info.badge}</AdminPill>
                        {link.opsOnly ? (
                          <AdminPill className="bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]">
                            Admin
                          </AdminPill>
                        ) : null}
                      </div>

                      <h3 className="mt-4 text-xl font-black tracking-[-0.05em]">
                        {link.title}
                      </h3>

                      <p className="mt-2 min-h-[3.4rem] text-sm font-bold leading-7 text-[#637B76]">
                        {link.description}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="truncate text-xs font-black text-[#2AA897]">
                          {link.href}
                        </span>
                        <span className="rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7] transition group-hover:bg-[#247A71] group-hover:text-white">
                          열기
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            </section>
          )
        })}
    </section>
  )

  if (embedded) return content

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      {content}
    </main>
  )
}

export default AdminMenuHub
