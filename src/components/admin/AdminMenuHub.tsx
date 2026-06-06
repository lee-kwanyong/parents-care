'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  developerMenuLinks,
  linksForRole,
  menuLinks,
  roleMeta,
  type MenuLink,
  type PortalRole
} from '@/lib/adminMenuRegistry'

type AdminMenuHubProps = {
  role?: PortalRole
  embedded?: boolean
  title?: string
  subtitle?: string
}

type ViewMode = 'accordion' | 'line'

const roleOrder: PortalRole[] = ['all', 'parent', 'child', 'careWorker', 'ops']

function groupLinks(links: MenuLink[]) {
  return links.reduce<Record<string, MenuLink[]>>((groups, link) => {
    const key = link.category || '기타'
    groups[key] = groups[key] || []
    groups[key].push(link)
    return groups
  }, {})
}

function rolePath(role: PortalRole) {
  if (role === 'all') return '/admin-menu'
  if (role === 'parent') return '/portal/parent'
  if (role === 'child') return '/portal/child'
  if (role === 'careWorker') return '/portal/care-worker'
  return '/portal/ops'
}

function badgeClass(role: PortalRole) {
  if (role === 'ops') return 'bg-[#247A71] text-white ring-[#247A71]'
  if (role === 'parent') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  if (role === 'child') return 'bg-[#F3F8FF] text-[#255B83] ring-[#D8EAFB]'
  if (role === 'careWorker') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function withDebug(path: string, debug: boolean) {
  if (!debug) return path
  return path.includes('?') ? path + '&debug=1' : path + '?debug=1'
}

export function AdminMenuHub({
  role = 'all',
  embedded = false,
  title,
  subtitle
}: AdminMenuHubProps) {
  const [debugMode, setDebugMode] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('accordion')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    setDebugMode(new URLSearchParams(window.location.search).get('debug') === '1')
  }, [])

  const visibleLinks = useMemo(() => linksForRole(role, debugMode), [role, debugMode])
  const grouped = useMemo(() => groupLinks(visibleLinks), [visibleLinks])
  const categories = useMemo(() => Object.keys(grouped), [grouped])

  const baseMenuCount = menuLinks.length
  const hiddenCount = developerMenuLinks.length

  function isOpen(category: string, index: number) {
    if (openGroups[category] !== undefined) return openGroups[category]
    return index < 5
  }

  function toggleGroup(category: string, index: number) {
    setOpenGroups({
      ...openGroups,
      [category]: !isOpen(category, index)
    })
  }

  function openAll() {
    const next: Record<string, boolean> = {}
    categories.forEach((category) => {
      next[category] = true
    })
    setOpenGroups(next)
  }

  function closeAll() {
    const next: Record<string, boolean> = {}
    categories.forEach((category) => {
      next[category] = false
    })
    setOpenGroups(next)
  }

  return (
    <main className={(embedded ? '' : 'min-h-screen') + ' bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8'}>
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            통합 운영 메뉴
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title || roleMeta[role].title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            {subtitle || roleMeta[role].description}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
            기본 메뉴는 실제 운영에 필요한 필수 화면을 보여줍니다.
            숨긴 개발자 경로 {hiddenCount}개는 필요할 때만 debug 모드에서 확인합니다.
          </div>

          <div className="mt-5 overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {roleOrder.map((item) => (
                <Link
                  key={item}
                  href={withDebug(rolePath(item), debugMode)}
                  className={
                    'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                    (role === item ? badgeClass(item) : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                  }
                >
                  {roleMeta[item].shortTitle}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode('accordion')}
              className={
                'rounded-2xl px-5 py-3 text-sm font-black ring-1 ' +
                (viewMode === 'accordion'
                  ? 'bg-[#247A71] text-white ring-[#247A71]'
                  : 'bg-white text-[#17443F] ring-[#D6EDE7]')
              }
            >
              펼쳐보기
            </button>

            <button
              type="button"
              onClick={() => setViewMode('line')}
              className={
                'rounded-2xl px-5 py-3 text-sm font-black ring-1 ' +
                (viewMode === 'line'
                  ? 'bg-[#247A71] text-white ring-[#247A71]'
                  : 'bg-white text-[#17443F] ring-[#D6EDE7]')
              }
            >
              가로 일자 목록
            </button>

            <button
              type="button"
              onClick={openAll}
              className="rounded-2xl bg-[#FAFFFD] px-5 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              모두 펼치기
            </button>

            <button
              type="button"
              onClick={closeAll}
              className="rounded-2xl bg-[#FAFFFD] px-5 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              모두 접기
            </button>

            {debugMode ? (
              <Link
                href={rolePath(role)}
                className="rounded-2xl bg-[#FFF9EE] px-5 py-3 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5]"
              >
                개발자 경로 숨기기
              </Link>
            ) : (
              <Link
                href={withDebug(rolePath(role), true)}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#637B76] ring-1 ring-[#D6EDE7]"
              >
                개발자 전체 경로 보기
              </Link>
            )}
          </div>

          <div className="mt-6 grid gap-2 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7] sm:grid-cols-4">
            <InfoLine label="현재 역할" value={roleMeta[role].shortTitle} />
            <InfoLine label="기본 메뉴" value={`${baseMenuCount}개`} />
            <InfoLine label="현재 표시" value={`${visibleLinks.length}개`} />
            <InfoLine label="개발자 경로" value={debugMode ? '표시 중' : '숨김'} />
          </div>
        </section>

        {viewMode === 'accordion' ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">
              {debugMode ? '전체 개발자 경로 포함 메뉴' : '필수 통합 메뉴'}
            </h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              카테고리를 눌러 펼치고, 필요한 화면으로 이동하세요.
            </p>

            <div className="mt-5 divide-y divide-[#D8EEE8] overflow-hidden rounded-2xl ring-1 ring-[#D6EDE7]">
              {Object.entries(grouped).map(([category, links], index) => {
                const opened = isOpen(category, index)

                return (
                  <section key={category} className="bg-white">
                    <button
                      type="button"
                      onClick={() => toggleGroup(category, index)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-[#FAFFFD]"
                    >
                      <div className="min-w-0">
                        <div className="text-xl font-black tracking-[-0.05em]">
                          {opened ? '▾' : '▸'} {category}
                        </div>
                        <div className="mt-1 text-xs font-bold text-[#637B76]">
                          {links.length}개 화면
                        </div>
                      </div>

                      <div className="rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#2AA897]">
                        {opened ? '접기' : '펼치기'}
                      </div>
                    </button>

                    {opened ? (
                      <div className="border-t border-[#D6EDE7] bg-[#FBFFFD]">
                        {links.map((link) => (
                          <MenuLine key={link.href + link.title} link={link} />
                        ))}
                      </div>
                    ) : null}
                  </section>
                )
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">
              {debugMode ? '전체 개발자 경로 일자 목록' : '필수 통합 메뉴 일자 목록'}
            </h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              카드 없이 한 줄 목록으로 표시합니다.
            </p>

            <div className="mt-5 overflow-x-auto">
              <div className="min-w-[960px] overflow-hidden rounded-2xl ring-1 ring-[#D6EDE7]">
                <div className="grid grid-cols-[12rem_16rem_1fr_16rem_7rem] gap-3 bg-[#FAFFFD] px-4 py-3 text-xs font-black text-[#637B76]">
                  <div>구분</div>
                  <div>메뉴</div>
                  <div>설명</div>
                  <div>경로</div>
                  <div>이동</div>
                </div>

                <div className="divide-y divide-[#D8EEE8] bg-white">
                  {visibleLinks.map((link) => (
                    <MenuTableRow key={link.href + link.title} link={link} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-[2rem] bg-[#247A71] p-5 text-white shadow-sm sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">통합 운영 흐름</h2>

          <div className="mt-5 overflow-x-auto">
            <div className="flex min-w-max items-center gap-3">
              <FlowStep number="1" title="부모님" desc="안부 신호 입력" />
              <FlowArrow />
              <FlowStep number="2" title="자녀" desc="상태·다음 할 일 확인" />
              <FlowArrow />
              <FlowStep number="3" title="도움망" desc="요청 수락·처리 완료" />
              <FlowArrow />
              <FlowStep number="4" title="운영실" desc="오토파일럿·알림·배정" />
              <FlowArrow />
              <FlowStep number="5" title="지자체" desc="관제·보고·실증" />
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-[#D6EDE7]">
      <span className="text-xs font-black text-[#637B76]">{label}</span>
      <span className="text-sm font-black text-[#17443F]">{value}</span>
    </div>
  )
}

function MenuLine({ link }: { link: MenuLink }) {
  return (
    <Link
      href={link.href}
      className="grid gap-2 border-b border-[#D6EDE7] px-4 py-4 transition last:border-b-0 hover:bg-white sm:grid-cols-[10rem_16rem_1fr_6rem] sm:items-center"
    >
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#2AA897] ring-1 ring-[#D6EDE7]">
          {link.badge || link.category}
        </span>
        {link.opsOnly ? (
          <span className="rounded-full bg-[#FFF9EE] px-3 py-1 text-xs font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
            운영실
          </span>
        ) : null}
      </div>

      <div className="min-w-0 text-base font-black tracking-[-0.04em] text-[#17443F]">
        {link.title}
      </div>

      <div className="min-w-0 text-sm font-bold leading-6 text-[#637B76]">
        {link.description}
      </div>

      <div className="text-sm font-black text-[#2AA897]">
        이동 →
      </div>
    </Link>
  )
}

function MenuTableRow({ link }: { link: MenuLink }) {
  return (
    <div className="grid grid-cols-[12rem_16rem_1fr_16rem_7rem] gap-3 px-4 py-3 text-sm font-bold text-[#17443F] hover:bg-[#FAFFFD]">
      <div className="flex items-center gap-2">
        <span className="truncate rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#2AA897]">
          {link.badge || link.category}
        </span>
      </div>

      <div className="truncate font-black">{link.title}</div>
      <div className="truncate text-[#637B76]">{link.description}</div>
      <div className="truncate text-xs text-[#637B76]">{link.href}</div>

      <Link
        href={link.href}
        className="rounded-full bg-[#247A71] px-3 py-2 text-center text-xs font-black text-white"
      >
        이동
      </Link>
    </div>
  )
}

function FlowStep({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex min-w-[15rem] items-center gap-3 rounded-full bg-white/10 px-4 py-3 ring-1 ring-white/20">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#17443F]">
        {number}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-black">{title}</div>
        <div className="mt-1 text-xs font-bold text-white/65">{desc}</div>
      </div>
    </div>
  )
}

function FlowArrow() {
  return <div className="text-2xl font-black text-white/40">→</div>
}

export default AdminMenuHub
