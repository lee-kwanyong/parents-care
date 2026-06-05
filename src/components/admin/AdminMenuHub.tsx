'use client'

import Link from 'next/link'
import {
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

const roleOrder: PortalRole[] = ['all', 'parent', 'child', 'careWorker', 'ops']

function groupLinks(links: MenuLink[]) {
  return links.reduce<Record<string, MenuLink[]>>((groups, link) => {
    const key = link.category || '기타'
    groups[key] = groups[key] || []
    groups[key].push(link)
    return groups
  }, {})
}

function roleLabel(role: PortalRole) {
  return roleMeta[role]?.title || '전체 메뉴'
}

function roleDesc(role: PortalRole) {
  return roleMeta[role]?.description || '안부웍스 전체 화면을 확인합니다.'
}

function badgeClass(role: PortalRole) {
  if (role === 'ops') return 'bg-[#193B38] text-white ring-[#193B38]'
  if (role === 'parent') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (role === 'child') return 'bg-[#EEF6FF] text-[#1B4E7A] ring-[#CFE5FA]'
  if (role === 'careWorker') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-white text-[#173B36] ring-[#D8EEE8]'
}

function importantLinks(role: PortalRole) {
  if (role === 'parent') {
    return linksForRole('parent').filter((link) =>
      ['/parent', '/family-link', '/portal/parent'].includes(link.href)
    )
  }

  if (role === 'child') {
    return linksForRole('child').filter((link) =>
      ['/child/dashboard', '/response', '/family-link', '/family/actions', '/portal/child'].includes(link.href)
    )
  }

  if (role === 'careWorker') {
    return linksForRole('careWorker').filter((link) =>
      ['/provider/requests', '/response/about', '/portal/care-worker'].includes(link.href)
    )
  }

  if (role === 'ops') {
    return linksForRole('ops').filter((link) =>
      [
        '/ops/autopilot',
        '/ops/heartbeat',
        '/ops/network',
        '/ops/notification-dispatch',
        '/response?scope=ops'
      ].includes(link.href)
    )
  }

  return [
    ...linksForRole('parent').slice(0, 2),
    ...linksForRole('child').slice(0, 2),
    ...linksForRole('careWorker').slice(0, 2),
    ...linksForRole('ops').slice(0, 4)
  ].filter(Boolean)
}

export function AdminMenuHub({
  role = 'all',
  embedded = false,
  title,
  subtitle
}: AdminMenuHubProps) {
  const currentRole = role
  const visibleLinks = linksForRole(currentRole)
  const grouped = groupLinks(visibleLinks)
  const quickLinks = importantLinks(currentRole)
  const totalCount = currentRole === 'all' ? menuLinks.length : visibleLinks.length

  return (
    <main className={(embedded ? '' : 'min-h-screen') + ' bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8'}>
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부웍스 역할별 메뉴
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title || roleLabel(currentRole)}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            {subtitle || roleDesc(currentRole)}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {roleOrder.map((item) => (
              <Link
                key={item}
                href={
                  item === 'all'
                    ? '/admin-menu'
                    : item === 'parent'
                      ? '/portal/parent'
                      : item === 'child'
                        ? '/portal/child'
                        : item === 'careWorker'
                          ? '/portal/care-worker'
                          : '/portal/ops'
                }
                className={
                  'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                  (currentRole === item ? badgeClass(item) : 'bg-white text-[#173B36] ring-[#D8EEE8]')
                }
              >
                {roleMeta[item].shortTitle}
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <MetricCard title="현재 역할" value={roleMeta[currentRole].shortTitle} desc={roleDesc(currentRole)} />
            <MetricCard title="메뉴 수" value={`${totalCount}개`} desc="이 역할에서 사용할 수 있는 화면" />
            <MetricCard title="운영 핵심" value="자동화" desc="신호·알림·배정·완료 흐름을 연결" />
            <MetricCard title="실증 방향" value="B2G" desc="지자체 관제·보고·도움망 운영 기준" />
          </div>
        </section>

        {quickLinks.length > 0 ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">바로 쓰는 핵심 메뉴</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              이 역할에서 가장 자주 쓰는 화면입니다.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {quickLinks.map((link) => (
                <MenuCard key={link.href + link.title} link={link} highlight />
              ))}
            </div>
          </section>
        ) : null}

        {Object.entries(grouped).map(([category, links]) => (
          <section key={category} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-[-0.06em]">{category}</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  {links.length}개 화면
                </p>
              </div>

              {category.includes('운영실') ? (
                <Link
                  href="/ops"
                  className="rounded-2xl bg-[#193B38] px-5 py-3 text-center text-sm font-black text-white"
                >
                  운영실 홈
                </Link>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <MenuCard key={link.href + link.title} link={link} />
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-[2rem] bg-[#193B38] p-5 text-white shadow-sm sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">운영 흐름 요약</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <FlowCard number="1" title="부모님" desc="식사·복약·몸 상태·도움 요청 신호를 남깁니다." />
            <FlowCard number="2" title="자녀" desc="상태와 다음 할 일을 보고 후속조치를 확인합니다." />
            <FlowCard number="3" title="도움망" desc="요청을 수락하고 전화·방문·식사·복약 확인 결과를 남깁니다." />
            <FlowCard number="4" title="운영실" desc="오토파일럿, Heartbeat, 알림, 배정, 리포트를 관리합니다." />
          </div>
        </section>
      </section>
    </main>
  )
}

function MetricCard({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <article className="rounded-[2rem] bg-[#F8FCFB] p-5 ring-1 ring-[#D8EEE8]">
      <div className="text-sm font-black text-[#637B76]">{title}</div>
      <div className="mt-2 text-3xl font-black tracking-[-0.08em] text-[#173B36]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{desc}</p>
    </article>
  )
}

function FlowCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <article className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-[#193B38]">
        {number}
      </div>
      <h3 className="mt-3 text-base font-black tracking-[-0.04em]">{title}</h3>
      <p className="mt-1 text-xs font-bold leading-6 text-white/75">{desc}</p>
    </article>
  )
}

function MenuCard({ link, highlight }: { link: MenuLink; highlight?: boolean }) {
  return (
    <Link
      href={link.href}
      className={
        'group rounded-2xl p-5 ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ' +
        (highlight
          ? 'bg-[#193B38] text-white ring-[#193B38]'
          : 'bg-[#F8FCFB] text-[#173B36] ring-[#D8EEE8]')
      }
    >
      <div className="flex flex-wrap gap-2">
        <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + (highlight ? 'bg-white/10 text-white ring-white/20' : 'bg-white text-[#11977F] ring-[#D8EEE8]')}>
          {link.badge || link.category}
        </span>

        {link.opsOnly ? (
          <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + (highlight ? 'bg-white/10 text-white ring-white/20' : 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]')}>
            운영실
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-xl font-black tracking-[-0.05em]">{link.title}</h3>
      <p className={'mt-2 text-sm font-bold leading-7 ' + (highlight ? 'text-white/75' : 'text-[#637B76]')}>
        {link.description}
      </p>

      <div className={'mt-4 text-xs font-black ' + (highlight ? 'text-white/60' : 'text-[#11977F]')}>
        {link.href}
      </div>
    </Link>
  )
}

export default AdminMenuHub
